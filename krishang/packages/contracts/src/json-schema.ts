import { Type } from "@sinclair/typebox";
import * as C from "./index.ts";

/** JSON Schema map for MCP tool generation (E1). CI should fail if this drifts. */
export const contractJsonSchemas = {
  ApprovalMintRequest: C.ApprovalMintRequest,
  DeployRequest: C.DeployRequest,
  AuthorRulesRequest: C.AuthorRulesRequest,
  PreviewRequest: C.PreviewRequest,
  RestoreRequest: C.RestoreRequest,
  RejectProposalRequest: C.RejectProposalRequest,
  StructuredRefusal: C.StructuredRefusal,
  SseEventEnvelope: C.SseEventEnvelope,
  RuleSetVersion: C.RuleSetVersion,
  Deployment: C.Deployment,
  Proposal: C.Proposal,
  catalog: Type.Object({
    contractsVersion: Type.Literal("1.0.0"),
  }),
};
