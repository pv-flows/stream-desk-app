use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};
use std::net::SocketAddr;

pub async fn start_server() {
    let app = Router::new().route("/ws", get(ws_handler));
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    println!("[Server] Servidor WebSocket iniciando em http://{}", addr);

    match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => {
            if let Err(err) = axum::serve(listener, app).await {
                eprintln!("[Server] Erro na execução do servidor: {:?}", err);
            }
        }
        Err(err) => {
            eprintln!("[Server] Falha ao vincular porta 8080: {:?}", err);
        }
    }
}

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    println!("[Server] Cliente conectado via WebSocket!");

    while let Some(msg_result) = socket.recv().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                println!("Comando recebido: {}", text);

                let response = serde_json::json!({
                    "status": "ok",
                    "message": "Comando recebido pelo PC"
                })
                .to_string();

                if let Err(err) = socket.send(Message::Text(response.into())).await {
                    eprintln!("[Server] Erro ao enviar resposta: {:?}", err);
                    break;
                }
            }
            Ok(Message::Close(_)) => {
                println!("[Server] Conexão encerrada pelo cliente.");
                break;
            }
            Ok(_) => {}
            Err(err) => {
                eprintln!("[Server] Erro no recebimento do socket: {:?}", err);
                break;
            }
        }
    }
}

