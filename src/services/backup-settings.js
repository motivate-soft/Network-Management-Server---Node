const BackupSchedulePeriod = {
  NONE: "none",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  HOUR: "hour"
};

const getNextBackupTime = (backupSettings, now) => {
  let nextBackupTime = new Date(now);
  switch (backupSettings.period) {
    case BackupSchedulePeriod.NONE:
      break;
    case BackupSchedulePeriod.DAY:
      nextBackupTime.setUTCDate(nextBackupTime.getUTCDate() + 1);
      break;
    case BackupSchedulePeriod.WEEK:
      // 0 Sunday, 1 Monday, 2 Tuesday...
      nextBackupTime.setUTCDate(nextBackupTime.getUTCDate() + (7 - nextBackupTime.getUTCDay()));
      break;
    case BackupSchedulePeriod.MONTH:
      nextBackupTime.setUTCMonth(nextBackupTime.getUTCMonth() + 1);
      nextBackupTime.setUTCDate(0);
      break;
  }
  if (backupSettings.period === BackupSchedulePeriod.HOUR) {
    nextBackupTime.setUTCHours(nextBackupTime.getUTCHours() + 1, 0, 0, 0);
  } else {
    nextBackupTime.setUTCHours(backupSettings.time, 0, 0, 0);
  }
  return nextBackupTime;
};

module.exports = {
  BackupSchedulePeriod,
  getNextBackupTime
};