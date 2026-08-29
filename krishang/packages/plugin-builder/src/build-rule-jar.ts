import { randomUUID } from "node:crypto";
import { contentDigest } from "@repo/contracts";
import { buildPluginJar } from "./jar-builder";
import { putOnce } from "./local-storage";
import { getS3Bucket } from "./s3-config";
import { uploadPluginJar, uploadPluginJson } from "./s3-storage";
import type { PluginBuilderBody } from "./types";
import { validatePluginBuilderBody } from "./validation";
import { generateYaml } from "./yaml-generator";

export type BuildRuleJarResult = {
  jarUrl: string;
  contentDigest: string;
};

export async function buildRuleJar(ruleJson: unknown): Promise<BuildRuleJarResult> {
  const validation = validatePluginBuilderBody(ruleJson);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const body: PluginBuilderBody = validation.value;
  const pluginName = validation.pluginName;
  const yamlContent = generateYaml(body);
  const jarBuffer = await buildPluginJar(pluginName, yamlContent);
  const jarBytes = new Uint8Array(jarBuffer);
  const digest = contentDigest(body, jarBytes);
  const keyBase = `write-once/${pluginName}/${randomUUID()}`;

  let jarUrl: string;
  let jsonUrl: string;
  if (process.env.S3_BUCKET) {
    jsonUrl = await uploadPluginJson(`${keyBase}.json`, body);
    jarUrl = await uploadPluginJar(`${keyBase}.jar`, jarBytes);
    void jsonUrl;
  } else {
    jsonUrl = await putOnce(`${keyBase}.json`, Buffer.from(JSON.stringify(body)), "application/json");
    jarUrl = await putOnce(`${keyBase}.jar`, jarBytes, "application/java-archive");
  }

  return { jarUrl, contentDigest: digest };
}

export { getS3Bucket };
