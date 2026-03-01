import { z } from "zod";

export interface AgentToolConfig<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  description: string;
  schema: T;
  func: (input: z.infer<T>) => Promise<any>;
}

export class AgentTool<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  description: string;
  schema: T;
  func: (input: z.infer<T>) => Promise<any>;

  constructor(config: AgentToolConfig<T>) {
    this.name = config.name;
    this.description = config.description;
    this.schema = config.schema;
    this.func = config.func;
  }

  async invoke(input: Record<string, any>): Promise<any> {
    const parsed = this.schema.parse(input);
    return this.func(parsed);
  }
}
