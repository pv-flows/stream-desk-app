import { z } from "zod";

export const backupButtonSchema = z.object({
  id: z.number().optional().default(0),
  label: z.string().min(1, "O rótulo do botão não pode ser vazio"),
  action_name: z.string().min(1, "A ação do botão não pode ser vazia"),
  color: z.string().default("#6366f1"),
  icon: z.string().optional().default("zap"),
  page_index: z.number().optional().default(0),
  position: z.number().optional().default(0),
});

export const backupPageSchema = z.object({
  id: z.number().optional().default(0),
  name: z.string().min(1, "O nome da página não pode ser vazio"),
});

export const backupWindowRuleSchema = z.object({
  id: z.number().optional().default(0),
  process_name: z.string().min(1, "O processo não pode ser vazio"),
  page_index: z.number(),
  enabled: z.boolean().optional().default(true),
});

export const backupAppearanceSchema = z.object({
  theme: z.string().optional().default("escuro"),
  accent_color: z.string().optional().default("purple"),
  grid_columns: z.number().optional().default(3),
  vibration_enabled: z.boolean().optional().default(true),
  icon_style: z.enum(["linha", "preenchido"]).optional().default("linha"),
});

export const backupPayloadSchema = z.object({
  version: z.string().optional(),
  exportedAt: z.string().optional(),
  theme: z.string().optional(),
  appearance: backupAppearanceSchema.optional(),
  pages: z.array(backupPageSchema).min(1, "O backup precisa conter pelo menos 1 página"),
  buttons: z.array(backupButtonSchema).default([]),
  windowRules: z.array(backupWindowRuleSchema).optional().default([]),
});

export type BackupPayload = z.infer<typeof backupPayloadSchema>;
