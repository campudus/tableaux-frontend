import moment from "moment";
import { Row } from "../types/grud";

// Singleton
class RowUnlock {
  static row: Row | null = null;

  static requestId: number | null = null;
  static requestedAt: string | null = null;
}

export const isLocked = (row?: Row) => {
  return row && !!row.final && !(row.id === RowUnlock.row?.id);
};

export const unlockRow = (row: Row) => {
  RowUnlock.row = row;
  RowUnlock.requestId = null;
  RowUnlock.requestedAt = null;
};

export const requestRowUnlock = (row: Row, key?: string) => {
  const canUnlockViaKey = !key || key === "Enter";

  if (!canUnlockViaKey) {
    return;
  }

  const requestId = RowUnlock.requestId;
  const requestedAt = moment(RowUnlock.requestedAt);
  const now = moment();

  if (requestId === row.id && now.diff(requestedAt, "seconds") <= 3) {
    unlockRow(row);
  } else {
    RowUnlock.row = null;
    RowUnlock.requestId = row.id;
    RowUnlock.requestedAt = now.toISOString();
  }
};

export const resetRowUnlock = () => {
  RowUnlock.row = null;
  RowUnlock.requestId = null;
  RowUnlock.requestedAt = null;
};

export const hasPendingUnlockRequest = (row: Row) => {
  const requestId = RowUnlock.requestId;

  return requestId === row.id;
};
