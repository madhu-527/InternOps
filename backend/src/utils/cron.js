const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

function setupCronJobs() {
  // Schedule: 0 * * * * (Runs exactly at the top of every hour: 01:00, 02:00, etc.)
  cron.schedule('0 * * * *', async () => {
    const jobName = 'proof-image-cleanup';
    const startTime = Date.now();

    // 1. Log Job Start
    console.info(
      JSON.stringify({
        job: jobName,
        startedAt: new Date(startTime),
      }),
      'Cron job started'
    );

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Find eligible records
      const { rows } = await pool.query(
        "SELECT id, image_path FROM proof_submissions WHERE status='VERIFIED' AND verified_at < $1 AND image_path IS NOT NULL",
        [cutoff]
      );
const deletionResults = await Promise.allSettled(
  rows.map(async (row) => {
    const fp = path.join(__dirname, '..', '..', row.image_path);

    try {
      await fs.promises.unlink(fp);
      return 1;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      return 0;
    }
  })
);

const filesDeleted = deletionResults.reduce((count, result) => {
  if (result.status === 'fulfilled') {
    return count + result.value;
  }
  return count;
}, 0);

      // Update database records
      await pool.query(
        "UPDATE proof_submissions SET image_path=NULL WHERE status='VERIFIED' AND verified_at < $1",
        [cutoff]
      );

      const durationMs = Date.now() - startTime;

      // 2. Log Job Completion with Metrics
      console.info(
        JSON.stringify({
          job: jobName,
          durationMs: durationMs,
          recordsProcessed: rows.length,
          filesDeleted: filesDeleted,
        }),
        'Cron job completed'
      );
    } catch (err) {
      // 3. Log Job Failure
      console.error(
        JSON.stringify({
          job: jobName,
          err: err.message,
          stack: err.stack,
        }),
        'Cron job failed'
      );
    }
  });
}

module.exports = { setupCronJobs };
