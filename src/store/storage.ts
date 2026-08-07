import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage 얇은 래퍼. 이 파일만 AsyncStorage를 직접 건드린다.
 * 키에 .v1을 붙인다 — 나중에 저장 모양이 바뀌면 키를 올려 옛 데이터를
 * 조용히 무시할 수 있다(마이그레이션 코드를 안 쓰기 위한 선택).
 */
const KEY_RECORDS = 'testmin.records.v1';
const KEY_NOTES = 'testmin.notes.v1';

/** JSON.parse 실패(깨진 문자열 등)는 null로 바꾼다. 절대 throw 하지 않는다. */
async function readRaw(key: string): Promise<unknown> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored === null ? null : JSON.parse(stored);
  } catch (e) {
    console.warn(`[storage] "${key}" 읽기 실패`, e);
    return null;
  }
}

/** 쓰기 실패도 삼킨다 — 저장이 안 돼도 앱은 계속 돌아야 한다. */
async function writeRaw(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] "${key}" 쓰기 실패`, e);
  }
}

export function loadRecordsRaw(): Promise<unknown> {
  return readRaw(KEY_RECORDS);
}

export function saveRecordsRaw(value: unknown): Promise<void> {
  return writeRaw(KEY_RECORDS, value);
}

export function loadNotesRaw(): Promise<unknown> {
  return readRaw(KEY_NOTES);
}

export function saveNotesRaw(value: unknown): Promise<void> {
  return writeRaw(KEY_NOTES, value);
}
