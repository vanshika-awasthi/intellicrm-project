import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function triggerWorkflow(companyId: string, entity: string, triggerOn: string, payload: any) {
  try {
    // 1. Fetch matching active workflow rules
    const rules = await prisma.workflowRule.findMany({
      where: { companyId, entity, triggerOn, isActive: true }
    });

    for (const rule of rules) {
      let matched = true;
      
      // The JSON structure of conditions expects Array of { field, operator, value }
      const conditions: any[] = Array.isArray(rule.conditions) ? rule.conditions : JSON.parse(rule.conditions as string || "[]");

      // 2. Evaluate Conditional Logic
      for (const cond of conditions) {
        if (!cond || !cond.field) continue;
        const actual = payload[cond.field];
        
        switch (cond.operator) {
          case "equals":
            if (actual != cond.value) matched = false;
            break;
          case "gt":
            if (Number(actual) <= Number(cond.value)) matched = false;
            break;
          case "lt":
            if (Number(actual) >= Number(cond.value)) matched = false;
            break;
          case "contains":
            if (typeof actual === 'string' && !actual.includes(cond.value)) matched = false;
            break;
        }
      }

      // 3. Inject matching actions into the Database background Job Queue
      if (matched) {
        const actions: any[] = Array.isArray(rule.actions) ? rule.actions : JSON.parse(rule.actions as string || "[]");
        
        for (const action of actions) {
          await prisma.jobQueue.create({
            data: {
              companyId,
              type: action.type,
              payload: { actionConfig: action, contextTrigger: payload },
              status: "pending"
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("[Workflow Engine Hook Error]", error);
  }
}
