use base64::prelude::*;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::Duration;
use tokio_tungstenite::tungstenite::Message;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObsSettings {
    pub host: String,
    pub port: u16,
    pub password: Option<String>,
    pub enabled: bool,
}

impl Default for ObsSettings {
    fn default() -> Self {
        Self {
            host: "localhost".to_string(),
            port: 4455,
            password: None,
            enabled: false,
        }
    }
}

fn compute_obs_auth(password: &str, salt: &str, challenge: &str) -> String {
    let mut h1 = Sha256::new();
    h1.update(password.as_bytes());
    h1.update(salt.as_bytes());
    let step1_b64 = BASE64_STANDARD.encode(h1.finalize());

    let mut h2 = Sha256::new();
    h2.update(step1_b64.as_bytes());
    h2.update(challenge.as_bytes());
    BASE64_STANDARD.encode(h2.finalize())
}

pub async fn send_obs_request(
    settings: &ObsSettings,
    request_type: &str,
    request_data: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let url = format!("ws://{}:{}", settings.host, settings.port);

    let connect_future = tokio_tungstenite::connect_async(&url);
    let (mut ws_stream, _) = tokio::time::timeout(Duration::from_secs(3), connect_future)
        .await
        .map_err(|_| "Tempo limite ao conectar ao OBS Studio (verifique se está aberto e com WebSocket v5 ativo)".to_string())?
        .map_err(|e| format!("Falha ao conectar no OBS em '{}': {}", url, e))?;

    // 1. Aguarda mensagem Hello (OpCode 0)
    let hello_msg = tokio::time::timeout(Duration::from_secs(3), ws_stream.next())
        .await
        .map_err(|_| "Tempo limite aguardando mensagem inicial do OBS".to_string())?
        .ok_or_else(|| "Conexão fechada pelo OBS antes da saudação inicial".to_string())?
        .map_err(|e| format!("Erro ao receber pacote inicial: {}", e))?;

    let hello_text = match hello_msg {
        Message::Text(t) => t,
        _ => return Err("Mensagem inicial inesperada do OBS".to_string()),
    };

    let hello_json: serde_json::Value =
        serde_json::from_str(&hello_text).map_err(|e| format!("JSON inválido do OBS: {}", e))?;

    let op = hello_json.get("op").and_then(|v| v.as_u64()).unwrap_or(999);
    if op != 0 {
        return Err(format!("OpCode inicial inválido: {}", op));
    }

    // 2. Monta mensagem Identify (OpCode 1)
    let mut identify_payload = serde_json::json!({
        "rpcVersion": 1
    });

    if let Some(auth_obj) = hello_json.get("d").and_then(|d| d.get("authentication")) {
        if let (Some(salt), Some(challenge)) = (
            auth_obj.get("salt").and_then(|s| s.as_str()),
            auth_obj.get("challenge").and_then(|c| c.as_str()),
        ) {
            let pass = settings.password.as_deref().unwrap_or("");
            if pass.is_empty() {
                return Err("OBS Studio requer autenticação por senha, mas nenhuma senha foi informada nas configurações".to_string());
            }
            let auth_hash = compute_obs_auth(pass, salt, challenge);
            identify_payload["authentication"] = serde_json::Value::String(auth_hash);
        }
    }

    let identify_msg = serde_json::json!({
        "op": 1,
        "d": identify_payload
    });

    ws_stream
        .send(Message::Text(identify_msg.to_string().into()))
        .await
        .map_err(|e| format!("Falha ao autenticar com OBS: {}", e))?;

    // 3. Aguarda Identified (OpCode 2)
    let identified_msg = tokio::time::timeout(Duration::from_secs(3), ws_stream.next())
        .await
        .map_err(|_| "Tempo limite aguardando confirmação de autenticação".to_string())?
        .ok_or_else(|| "Conexão fechada pelo OBS após autenticação".to_string())?
        .map_err(|e| format!("Erro de rede ao aguardar autenticação: {}", e))?;

    let identified_text = match identified_msg {
        Message::Text(t) => t,
        _ => return Err("Resposta de autenticação inválida".to_string()),
    };

    let identified_json: serde_json::Value = serde_json::from_str(&identified_text)
        .map_err(|e| format!("JSON de autenticação inválido: {}", e))?;

    let identified_op = identified_json.get("op").and_then(|v| v.as_u64()).unwrap_or(999);
    if identified_op != 2 {
        return Err(format!(
            "Autenticação no OBS falhou (OpCode: {}). Verifique a senha configurada.",
            identified_op
        ));
    }

    // 4. Envia o Request real (OpCode 6)
    let req_id = "streamdesk-obs-req";
    let request_msg = serde_json::json!({
        "op": 6,
        "d": {
            "requestType": request_type,
            "requestId": req_id,
            "requestData": request_data.unwrap_or_else(|| serde_json::json!({}))
        }
    });

    ws_stream
        .send(Message::Text(request_msg.to_string().into()))
        .await
        .map_err(|e| format!("Falha ao enviar comando para OBS: {}", e))?;

    // 5. Aguarda RequestResponse (OpCode 7)
    while let Ok(Some(resp_res)) = tokio::time::timeout(Duration::from_secs(4), ws_stream.next()).await {
        let msg = resp_res.map_err(|e| format!("Erro ao ler resposta do OBS: {}", e))?;
        if let Message::Text(resp_text) = msg {
            if let Ok(resp_json) = serde_json::from_str::<serde_json::Value>(&resp_text) {
                let op = resp_json.get("op").and_then(|v| v.as_u64()).unwrap_or(0);
                if op == 7 {
                    let d = resp_json.get("d").ok_or_else(|| "Resposta sem payload".to_string())?;
                    let resp_req_id = d.get("requestId").and_then(|r| r.as_str()).unwrap_or("");
                    if resp_req_id == req_id {
                        let status = d.get("requestStatus").ok_or_else(|| "Sem requestStatus".to_string())?;
                        let result = status.get("result").and_then(|r| r.as_bool()).unwrap_or(false);
                        if result {
                            return Ok(d.get("responseData").cloned().unwrap_or_else(|| serde_json::json!({})));
                        } else {
                            let comment = status.get("comment").and_then(|c| c.as_str()).unwrap_or("Comando rejeitado");
                            return Err(format!("OBS recusou a requisição '{}': {}", request_type, comment));
                        }
                    }
                }
            }
        }
    }

    Err(format!("OBS não retornou confirmação para '{}'", request_type))
}

pub async fn test_obs_connection(settings: &ObsSettings) -> Result<String, String> {
    let res = send_obs_request(settings, "GetVersion", None).await?;
    let version = res
        .get("obsVersion")
        .and_then(|v| v.as_str())
        .unwrap_or("5.x");
    Ok(format!("OBS Studio v{} conectado com sucesso!", version))
}

pub async fn obs_dispatch(settings: &ObsSettings, action: &str) -> Result<serde_json::Value, String> {
    if !action.starts_with("obs:") {
        return Err(format!("Ação '{}' não é um comando OBS válido", action));
    }

    let sub = &action[4..];
    match sub {
        "start_stream" => send_obs_request(settings, "StartStream", None).await,
        "stop_stream" => send_obs_request(settings, "StopStream", None).await,
        "toggle_stream" => send_obs_request(settings, "ToggleStream", None).await,
        "start_record" => send_obs_request(settings, "StartRecord", None).await,
        "stop_record" => send_obs_request(settings, "StopRecord", None).await,
        "toggle_record" => send_obs_request(settings, "ToggleRecord", None).await,
        _ => {
            if let Some(scene) = sub.strip_prefix("switch_scene:") {
                let data = serde_json::json!({ "sceneName": scene.trim() });
                send_obs_request(settings, "SetCurrentProgramScene", Some(data)).await
            } else if let Some(source) = sub.strip_prefix("toggle_mute:") {
                let data = serde_json::json!({ "inputName": source.trim() });
                send_obs_request(settings, "ToggleInputMute", Some(data)).await
            } else {
                send_obs_request(settings, sub.trim(), None).await
            }
        }
    }
}

