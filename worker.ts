import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function processJob(job: any) {
  console.log(`\n[WORKER] Processing Job ${job.id} | Type: ${job.type}`);
  
  try {
    const { actionConfig, contextTrigger } = job.payload as any;

    // RULE: Auto Assign
    if (job.type === "auto_assign") {
      const targetUserId = actionConfig.userId;
      if (!targetUserId) throw new Error("Missing assignment target user in configuration.");
      
      console.log(`[WORKER Action] Auto-Assigning entity ID ${contextTrigger.id} to User ${targetUserId}`);

      if (contextTrigger.stage !== undefined) {
        // It's an opportunity
        await prisma.opportunity.update({
          where: { id: contextTrigger.id },
          data: { assignedTo: targetUserId }
        });
      } else {
        // It's a contact
        await prisma.contact.update({
          where: { id: contextTrigger.id },
          data: { assignedTo: targetUserId }
        });
      }
      console.log(`[WORKER Result] Assignment Executed.`);
    }

    // RULE: Send Follow-Up Email (Mock NodeMailer logic)
    else if (job.type === "send_email") {
      console.log(`\n--- [WORKER ACTION: EMAIL DISPATCH LAUNCHED] ---`);
      console.log(`To: ${contextTrigger.email || contextTrigger.name}`);
      console.log(`Subject: ${actionConfig.subject || "Follow-up"}`);
      console.log(`Body: ${actionConfig.body || "Hello..."}`);
      console.log(`-------------------------------------------------\n`);
      
      // We would use an actual transport like Resend or Sendgrid here.
      await new Promise(res => setTimeout(res, 500)); // Simulating API latency
    }
    
    // Extensibility: other actions...
    else {
      throw new Error(`Unrecognized job action type: ${job.type}`);
    }

    // Mark complete
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: "completed" }
    });
    console.log(`[WORKER] Job ${job.id} marked COMPLETED.`);

  } catch (err: any) {
    console.error(`[WORKER] Job ${job.id} FAILED:`, err.message);
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: "failed", error: err.message }
    });
  }
}

async function loop() {
  console.log("[WORKER] Booting Background Polling Engine... Awaiting Jobs.");
  
  while (true) {
    try {
      // Find oldest pending job. We use a transaction to lock the row.
      const jobs = await prisma.jobQueue.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 1
      });

      if (jobs.length > 0) {
        const job = jobs[0];
        
        // Optimistic lock grab
        const lock = await prisma.jobQueue.updateMany({
          where: { id: job.id, status: "pending" },
          data: { status: "processing" }
        });

        if (lock.count === 1) {
          // Process fully
          await processJob(job);
        }
      } else {
        // No jobs, sleep for 3 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (err) {
      console.error("[WORKER CATASTROPHIC POLLING ERROR]", err);
      await new Promise(resolve => setTimeout(resolve, 5000)); // backoff
    }
  }
}

// Start worker securely
loop();
