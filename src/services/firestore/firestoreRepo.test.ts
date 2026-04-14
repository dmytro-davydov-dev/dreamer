import type { Firestore } from "firebase/firestore";

import {
  bulkUpsertElements,
  bulkUpsertHypotheses,
  createAssociation,
  createDream,
  deleteDreamHard,
  deleteAssociation,
  getDream,
  getDreamSession,
  getIntegration,
  listAssociations,
  listAssociationsForElement,
  listDreams,
  listElements,
  listHypotheses,
  setHypothesisFeedback,
  softDeleteElement,
  subscribeDreamSession,
  subscribeDreams,
  syncDreamStatus,
  updateAssociation,
  updateDream,
  updateIntegrationJournal,
  upsertElement,
  upsertIntegration,
} from "./firestoreRepo";

const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockLimit = jest.fn((n: number) => ({ type: "limit", n }));
const mockOnSnapshot = jest.fn();
const mockOrderBy = jest.fn((field: string, order: string) => ({ type: "orderBy", field, order }));
const mockQuery = jest.fn((...args: unknown[]) => ({ args }));
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockWhere = jest.fn((field: string, op: string, value: unknown) => ({
  type: "where",
  field,
  op,
  value,
}));
const mockWriteBatch = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  Timestamp: { now: jest.fn() },
}));

const mockNowTs = jest.fn();
jest.mock("./timestamps", () => ({
  nowTs: () => mockNowTs(),
}));

function makeRef(path: string) {
  return {
    path,
    id: path.split("/").at(-1),
    withConverter() {
      return this;
    },
  };
}

function makeSnap<T>(data: T | null) {
  return {
    exists: () => data !== null,
    data: () => data,
  };
}

function makeQuerySnapshot<T>(rows: Array<{ id: string; data: T }>) {
  return {
    empty: rows.length === 0,
    docs: rows.map((r) => ({
      id: r.id,
      data: () => r.data,
      ref: makeRef(`ref/${r.id}`),
    })),
  };
}

describe("services/firestore/firestoreRepo", () => {
  const db = {} as Firestore;
  const uid = "user-1";
  const dreamId = "dream-1";
  const ts = { seconds: 1, nanoseconds: 0 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNowTs.mockReturnValue(ts);
    mockCollection.mockImplementation((_db: unknown, path: string) => makeRef(path));
    mockDoc.mockImplementation((_db: unknown, path: string) => makeRef(path));
  });

  it("createDream creates a draft dream with defaults and returns id", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-dream" });

    const result = await createDream(db, uid, { rawText: "A mountain path" });

    expect(result.dreamId).toBe("new-dream");
    expect(result.dream.status).toBe("draft");
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it("updateDream writes patch with updatedAt", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateDream(db, uid, dreamId, { status: "structured" });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "structured", updatedAt: ts })
    );
  });

  it("getDream returns null when document does not exist", async () => {
    mockGetDoc.mockResolvedValue(makeSnap(null));

    await expect(getDream(db, uid, dreamId)).resolves.toBeNull();
  });

  it("getDream returns typed data when document exists", async () => {
    const dream = { rawText: "Bridge", status: "draft", dreamedAt: ts, createdAt: ts };
    mockGetDoc.mockResolvedValue(makeSnap(dream));

    await expect(getDream(db, uid, dreamId)).resolves.toEqual(dream);
  });

  it("listDreams applies status and pagination constraints", async () => {
    const rows = [{ id: "d1", data: { rawText: "r", status: "draft" } }];
    mockGetDocs.mockResolvedValue(makeQuerySnapshot(rows));

    const result = await listDreams(db, uid, { onlyStatus: "draft", pageSize: 5 });

    expect(mockWhere).toHaveBeenCalledWith("status", "==", "draft");
    expect(mockLimit).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d1");
  });

  it("subscribeDreams maps snapshot docs and returns unsubscribe", () => {
    const unsubscribe = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snaps: unknown) => void) => {
      cb(makeQuerySnapshot([{ id: "d1", data: { rawText: "dream", status: "draft" } }]));
      return unsubscribe;
    });

    const cb = jest.fn();
    const unsub = subscribeDreams(db, uid, cb);

    expect(cb).toHaveBeenCalledWith([{ id: "d1", data: { rawText: "dream", status: "draft" } }]);
    expect(typeof unsub).toBe("function");
    unsub();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it("listElements supports includeDeleted path", async () => {
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([{ id: "e1", data: { label: "Door" } }]));

    const result = await listElements(db, uid, dreamId, { includeDeleted: true });

    expect(result[0].id).toBe("e1");
  });

  it("upsertElement uses merge=true", async () => {
    await upsertElement(db, uid, dreamId, "el-1", {
      kind: "symbol",
      label: "Door",
      createdAt: ts as never,
      source: "ai",
    });

    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.any(Object), { merge: true });
  });

  it("softDeleteElement marks element deleted and user-owned", async () => {
    await softDeleteElement(db, uid, dreamId, "el-1");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ deleted: true, source: "user", updatedAt: ts })
    );
  });

  it("bulkUpsertElements writes each row in a batch", async () => {
    const set = jest.fn();
    const commit = jest.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set, commit });

    await bulkUpsertElements(db, uid, dreamId, [
      {
        id: "el-1",
        data: { kind: "symbol", label: "Bridge", createdAt: ts as never, source: "ai" },
      },
      {
        id: "el-2",
        data: { kind: "place", label: "Forest", createdAt: ts as never, source: "user" },
      },
    ]);

    expect(set).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("createAssociation clamps salience and returns created row", async () => {
    mockAddDoc.mockResolvedValue({ id: "assoc-1" });

    const result = await createAssociation(db, uid, dreamId, {
      elementId: "el-1",
      associationText: "Fear of failure",
      emotionalValence: "negative",
      salience: 9,
    });

    expect(result.id).toBe("assoc-1");
    expect(result.data.salience).toBe(5);
  });

  it("updateAssociation applies partial patch and updatedAt", async () => {
    await updateAssociation(db, uid, dreamId, "assoc-1", {
      associationText: "Updated",
      salience: 2,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ associationText: "Updated", salience: 2, updatedAt: ts })
    );
  });

  it("lists and deletes associations", async () => {
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([{ id: "a1", data: { associationText: "x" } }]));

    const all = await listAssociations(db, uid, dreamId);
    const byElement = await listAssociationsForElement(db, uid, dreamId, "el-1");
    await deleteAssociation(db, uid, dreamId, "a1");

    expect(all).toHaveLength(1);
    expect(byElement).toHaveLength(1);
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it("bulkUpsertHypotheses and listHypotheses work with batches and snapshots", async () => {
    const set = jest.fn();
    const commit = jest.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ set, commit });
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([{ id: "h1", data: { hypothesisText: "Could be..." } }]));

    await bulkUpsertHypotheses(db, uid, dreamId, [
      {
        id: "h1",
        data: {
          lens: "shadow",
          hypothesisText: "Could be blocked emotion.",
          evidence: [{ type: "dream_text", refId: "dream_text", quote: "locked" }],
          reflectiveQuestion: "What are you avoiding?",
          createdAt: ts as never,
        },
      },
    ]);
    const list = await listHypotheses(db, uid, dreamId);

    expect(set).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(list[0].id).toBe("h1");
  });

  it("setHypothesisFeedback writes feedback with updatedAt", async () => {
    await setHypothesisFeedback(db, uid, dreamId, "h1", "resonates");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userFeedback: "resonates", updatedAt: ts })
    );
  });

  it("getIntegration, upsertIntegration, and updateIntegrationJournal behave correctly", async () => {
    const integration = {
      reflectiveQuestions: ["What wants attention?"],
      practiceSuggestion: "Write one paragraph.",
      createdAt: ts,
    };
    mockGetDoc.mockResolvedValue(makeSnap(integration));

    const loaded = await getIntegration(db, uid, dreamId);
    await upsertIntegration(db, uid, dreamId, integration as never);
    await updateIntegrationJournal(db, uid, dreamId, "journal text");

    expect(loaded).toEqual(integration);
    expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), integration, { merge: true });
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { journalText: "journal text", updatedAt: ts },
      { merge: true }
    );
  });

  it("getDreamSession aggregates all artifacts", async () => {
    mockGetDoc
      .mockResolvedValueOnce(
        makeSnap({
          rawText: "a dream",
          dreamedAt: ts,
          createdAt: ts,
          status: "draft",
        })
      )
      .mockResolvedValueOnce(makeSnap({ reflectiveQuestions: ["q"], practiceSuggestion: "s", createdAt: ts }));

    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnapshot([{ id: "el-1", data: { label: "Tree" } }]))
      .mockResolvedValueOnce(makeQuerySnapshot([{ id: "a-1", data: { associationText: "Growth" } }]))
      .mockResolvedValueOnce(makeQuerySnapshot([{ id: "h-1", data: { hypothesisText: "Could be..." } }]));

    const session = await getDreamSession(db, uid, dreamId);

    expect(session?.dreamId).toBe(dreamId);
    expect(session?.elements).toHaveLength(1);
    expect(session?.associations).toHaveLength(1);
    expect(session?.hypotheses).toHaveLength(1);
    expect(session?.integration?.id).toBe("main");
  });

  it("getDreamSession returns null when dream is missing", async () => {
    mockGetDoc.mockResolvedValueOnce(makeSnap(null));

    await expect(getDreamSession(db, uid, dreamId)).resolves.toBeNull();
  });

  it("deleteDreamHard deletes known subcollections, integration, and main doc", async () => {
    const del = jest.fn();
    const commit = jest.fn().mockResolvedValue(undefined);
    mockWriteBatch.mockReturnValue({ delete: del, commit });

    mockGetDocs
      .mockResolvedValueOnce(
        makeQuerySnapshot([
          { id: "el-1", data: { label: "Tree" } },
          { id: "el-2", data: { label: "River" } },
        ])
      )
      .mockResolvedValueOnce(
        makeQuerySnapshot([{ id: "a-1", data: { associationText: "Memory" } }])
      )
      .mockResolvedValueOnce(makeQuerySnapshot([{ id: "h-1", data: { hypothesisText: "Could be..." } }]));

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      ref: makeRef("users/user-1/dreams/dream-1/integration/main"),
    });

    await deleteDreamHard(db, uid, dreamId);

    expect(del).toHaveBeenCalledTimes(6);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("subscribeDreamSession emits combined session and unsubscribes all listeners", () => {
    const unsubscribers = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
    const callbacks: Array<(value: unknown) => void> = [];

    mockOnSnapshot.mockImplementation((_q: unknown, cb: (value: unknown) => void) => {
      callbacks.push(cb);
      return unsubscribers[callbacks.length - 1];
    });

    const cb = jest.fn();
    const unsubscribe = subscribeDreamSession(db, uid, dreamId, cb);

    callbacks[0](makeSnap({ rawText: "dream", status: "draft" }));
    callbacks[1](makeQuerySnapshot([{ id: "el-1", data: { label: "Tree" } }]));
    callbacks[2](makeQuerySnapshot([{ id: "a-1", data: { associationText: "Memory" } }]));
    callbacks[3](makeQuerySnapshot([{ id: "h-1", data: { hypothesisText: "Could be..." } }]));
    callbacks[4](makeSnap({ reflectiveQuestions: ["Q"], practiceSuggestion: "S", createdAt: ts }));

    expect(cb).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dreamId,
        dream: expect.objectContaining({ rawText: "dream" }),
        integration: expect.objectContaining({ id: "main" }),
      })
    );

    unsubscribe();
    unsubscribers.forEach((u) => expect(u).toHaveBeenCalledTimes(1));
  });

  it("syncDreamStatus computes derived status and updates dream in transaction", async () => {
    const txGet = jest.fn((ref: { path: string }) => {
      if (ref.path.endsWith("/integration/main")) {
        return Promise.resolve(makeSnap(null));
      }
      return Promise.resolve(makeSnap({ status: "draft" }));
    });
    const txUpdate = jest.fn();

    mockRunTransaction.mockImplementation(async (_dbArg: unknown, fn: (tx: unknown) => Promise<void>) =>
      fn({ get: txGet, update: txUpdate })
    );

    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnapshot([{ id: "el-1", data: { label: "Tree" } }]))
      .mockResolvedValueOnce(makeQuerySnapshot([]))
      .mockResolvedValueOnce(makeQuerySnapshot([]));

    await syncDreamStatus(db, uid, dreamId);

    expect(txUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ path: `users/${uid}/dreams/${dreamId}` }),
      expect.objectContaining({ status: "structured", updatedAt: ts })
    );
  });
});