/* src/services/firestore/firestoreRepo.ts
 * Dreamer — Typed Firestore Repository Helpers
 * Firestore-first, backendless MVP
 *
 * Requires:
 * - firebase/app + firebase/firestore installed
 * - A Firebase app initialized elsewhere and passed in (or imported)
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
  type UpdateData,
} from "firebase/firestore";

import { converters } from "./converters";
import { paths } from "./paths";
import { nowTs } from "./timestamps";

import {
  defaults,
  type AssociationDoc,
  type AssociationId,
  type DreamDoc,
  type DreamElementDoc,
  type DreamId,
  type DreamSession,
  type DreamStatus,
  type ElementId,
  type HypothesisDoc,
  type HypothesisFeedback,
  type HypothesisId,
  type IntegrationDoc,
  type UID,
} from "../../shared/types/domain";

/** -----------------------------
 *  Utilities
 *  ----------------------------- */

/** Ensure salience is within 1..5 */
const clampSalience = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

function dreamRef(db: Firestore, uid: UID, dreamId: DreamId) {
  return doc(db, paths.dream(uid, dreamId)).withConverter(converters.dream);
}

function dreamsCol(db: Firestore, uid: UID) {
  return collection(db, paths.dreams(uid)).withConverter(converters.dream);
}

function elementsCol(db: Firestore, uid: UID, dreamId: DreamId) {
  return collection(db, paths.elements(uid, dreamId)).withConverter(
    converters.element
  );
}

function elementRef(db: Firestore, uid: UID, dreamId: DreamId, elementId: ElementId) {
  return doc(db, paths.element(uid, dreamId, elementId)).withConverter(
    converters.element
  );
}

function associationsCol(db: Firestore, uid: UID, dreamId: DreamId) {
  return collection(db, paths.associations(uid, dreamId)).withConverter(
    converters.association
  );
}

function associationRef(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  associationId: AssociationId
) {
  return doc(db, paths.association(uid, dreamId, associationId)).withConverter(
    converters.association
  );
}

function hypothesesCol(db: Firestore, uid: UID, dreamId: DreamId) {
  return collection(db, paths.hypotheses(uid, dreamId)).withConverter(
    converters.hypothesis
  );
}

function hypothesisRef(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  hypothesisId: HypothesisId
) {
  return doc(db, paths.hypothesis(uid, dreamId, hypothesisId)).withConverter(
    converters.hypothesis
  );
}

function integrationMainRef(db: Firestore, uid: UID, dreamId: DreamId) {
  return doc(db, paths.integrationMain(uid, dreamId)).withConverter(
    converters.integration
  );
}

/** -----------------------------
 *  Dream CRUD
 *  ----------------------------- */

export interface CreateDreamInput {
  rawText: string;
  dreamedAt?: Timestamp; // defaults now
  mood?: string;
  lifeContext?: string;
}

/**
 * Create a new Dream document with status="draft".
 * Returns the new dreamId and dream data.
 */
export async function createDream(
  db: Firestore,
  uid: UID,
  input: CreateDreamInput
): Promise<{ dreamId: DreamId; dream: DreamDoc }> {
  const createdAt = nowTs();
  const dream: DreamDoc = defaults.dream({
    rawText: input.rawText,
    dreamedAt: input.dreamedAt ?? createdAt,
    createdAt,
    mood: input.mood,
    lifeContext: input.lifeContext,
  });

  const ref = await addDoc(dreamsCol(db, uid), dream);
  return { dreamId: ref.id, dream };
}

export interface UpdateDreamInput {
  rawText?: string;
  dreamedAt?: Timestamp;
  mood?: string;
  lifeContext?: string;
  status?: DreamStatus;
}

/** Partial update of an existing dream */
export async function updateDream(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  patch: UpdateDreamInput
): Promise<void> {
  // Keep patch minimal & typed
  const toWrite: UpdateData<DreamDoc> = {
    ...patch,
    updatedAt: nowTs(),
  };

  await updateDoc(dreamRef(db, uid, dreamId), toWrite);
}

/** Get a single dream doc */
export async function getDream(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<DreamDoc | null> {
  const snap = await getDoc(dreamRef(db, uid, dreamId));
  return snap.exists() ? snap.data() : null;
}

/** List dreams ordered by dreamedAt desc (default) */
export async function listDreams(
  db: Firestore,
  uid: UID,
  opts?: { pageSize?: number; onlyStatus?: DreamStatus }
): Promise<Array<{ id: DreamId; data: DreamDoc }>> {
  const constraints: QueryConstraint[] = [orderBy("dreamedAt", "desc")];
  if (opts?.onlyStatus) constraints.unshift(where("status", "==", opts.onlyStatus));
  if (opts?.pageSize) constraints.push(limit(opts.pageSize));

  const q = query(dreamsCol(db, uid), ...constraints);
  const snaps = await getDocs(q);

  return snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
}

/** Subscribe to dream list */
export function subscribeDreams(
  db: Firestore,
  uid: UID,
  cb: (rows: Array<{ id: DreamId; data: DreamDoc }>) => void,
  opts?: { pageSize?: number; onlyStatus?: DreamStatus }
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy("dreamedAt", "desc")];
  if (opts?.onlyStatus) constraints.unshift(where("status", "==", opts.onlyStatus));
  if (opts?.pageSize) constraints.push(limit(opts.pageSize));

  const q = query(dreamsCol(db, uid), ...constraints);
  return onSnapshot(q, (snaps) => cb(snaps.docs.map((d) => ({ id: d.id, data: d.data() }))));
}

/** Delete a dream and all subcollections (safe, transactional-ish approach) */
export async function deleteDreamHard(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<void> {
  // Firestore has no true cascading deletes in client SDK.
  // MVP approach: batch delete known subcollections; for large data, do server-side cleanup later.
  const b = writeBatch(db);

  // Delete subcollections
  const [els, assocs, hyps] = await Promise.all([
    getDocs(query(elementsCol(db, uid, dreamId))),
    getDocs(query(associationsCol(db, uid, dreamId))),
    getDocs(query(hypothesesCol(db, uid, dreamId))),
  ]);

  els.docs.forEach((d) => b.delete(d.ref));
  assocs.docs.forEach((d) => b.delete(d.ref));
  hyps.docs.forEach((d) => b.delete(d.ref));

  // Delete integration doc if exists
  const integSnap = await getDoc(integrationMainRef(db, uid, dreamId));
  if (integSnap.exists()) b.delete(integSnap.ref);

  // Delete main dream doc
  b.delete(doc(db, paths.dream(uid, dreamId)));

  await b.commit();
}

/** -----------------------------
 *  Elements (CRUD + bulk)
 *  ----------------------------- */

export async function listElements(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  opts?: { includeDeleted?: boolean }
): Promise<Array<{ id: ElementId; data: DreamElementDoc }>> {
  // Fetch all elements and filter/sort in memory to avoid requiring composite
  // Firestore indexes (elements per dream are small, so this is fine for MVP).
  const snaps = await getDocs(elementsCol(db, uid, dreamId));
  const all = snaps.docs.map((d) => ({ id: d.id, data: d.data() }));

  const visible = opts?.includeDeleted
    ? all
    : all.filter((e) => !e.data.deleted);

  return visible.sort((a, b) => {
    if (a.data.kind < b.data.kind) return -1;
    if (a.data.kind > b.data.kind) return 1;
    return (a.data.order ?? 0) - (b.data.order ?? 0);
  });
}

/** Upsert a single element by id (caller decides id) */
export async function upsertElement(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  elementId: ElementId,
  data: DreamElementDoc
): Promise<void> {
  await setDoc(elementRef(db, uid, dreamId, elementId), data, { merge: true });
}

/** Soft delete element */
export async function softDeleteElement(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  elementId: ElementId
): Promise<void> {
  const toWrite: UpdateData<DreamElementDoc> = {
    deleted: true,
    updatedAt: nowTs(),
    source: "user",
  };

  await updateDoc(elementRef(db, uid, dreamId, elementId), toWrite);
}

/** Bulk upsert elements (e.g., after extraction or user edits) */
export async function bulkUpsertElements(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  rows: Array<{ id: ElementId; data: DreamElementDoc }>
): Promise<void> {
  const b = writeBatch(db);
  rows.forEach((r) => {
    b.set(elementRef(db, uid, dreamId, r.id), r.data, { merge: true });
  });
  await b.commit();
}

/** -----------------------------
 *  Associations (CRUD + queries)
 *  ----------------------------- */

export interface UpsertAssociationInput {
  elementId: ElementId;
  associationText: string;
  emotionalValence: AssociationDoc["emotionalValence"];
  salience: number; // 1..5
}

/** Create association (auto id) */
export async function createAssociation(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  input: UpsertAssociationInput
): Promise<{ id: AssociationId; data: AssociationDoc }> {
  const createdAt = nowTs();
  const data: AssociationDoc = {
    elementId: input.elementId,
    associationText: input.associationText,
    emotionalValence: input.emotionalValence,
    salience: clampSalience(input.salience),
    createdAt,
  };

  const ref = await addDoc(associationsCol(db, uid, dreamId), data);
  return { id: ref.id, data };
}

/** Update association by id */
export async function updateAssociation(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  associationId: AssociationId,
  patch: Partial<UpsertAssociationInput>
): Promise<void> {
  const toWrite: UpdateData<AssociationDoc> = {
    ...(patch.elementId ? { elementId: patch.elementId } : {}),
    ...(patch.associationText ? { associationText: patch.associationText } : {}),
    ...(patch.emotionalValence ? { emotionalValence: patch.emotionalValence } : {}),
    ...(patch.salience ? { salience: clampSalience(patch.salience) } : {}),
    updatedAt: nowTs(),
  };

  await updateDoc(associationRef(db, uid, dreamId, associationId), toWrite);
}

export async function listAssociations(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<Array<{ id: AssociationId; data: AssociationDoc }>> {
  const snaps = await getDocs(query(associationsCol(db, uid, dreamId), orderBy("createdAt", "asc")));
  return snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
}

/** List associations for a particular elementId (e.g., for a symbol) */
export async function listAssociationsForElement(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  elementId: ElementId
): Promise<Array<{ id: AssociationId; data: AssociationDoc }>> {
  const snaps = await getDocs(
    query(
      associationsCol(db, uid, dreamId),
      where("elementId", "==", elementId),
      orderBy("createdAt", "asc")
    )
  );
  return snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
}

export async function deleteAssociation(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  associationId: AssociationId
): Promise<void> {
  await deleteDoc(associationRef(db, uid, dreamId, associationId));
}

/** -----------------------------
 *  Hypotheses (CRUD + feedback)
 *  ----------------------------- */

export async function bulkUpsertHypotheses(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  rows: Array<{ id: HypothesisId; data: HypothesisDoc }>
): Promise<void> {
  const b = writeBatch(db);
  rows.forEach((r) => b.set(hypothesisRef(db, uid, dreamId, r.id), r.data, { merge: true }));
  await b.commit();
}

export async function listHypotheses(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<Array<{ id: HypothesisId; data: HypothesisDoc }>> {
  const snaps = await getDocs(query(hypothesesCol(db, uid, dreamId), orderBy("createdAt", "asc")));
  return snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
}

export async function setHypothesisFeedback(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  hypothesisId: HypothesisId,
  feedback: HypothesisFeedback
): Promise<void> {
  const toWrite: UpdateData<HypothesisDoc> = {
    userFeedback: feedback,
    updatedAt: nowTs(),
  };

  await updateDoc(hypothesisRef(db, uid, dreamId, hypothesisId), toWrite);
}

/** -----------------------------
 *  Integration (CRUD)
 *  ----------------------------- */

export async function getIntegration(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<IntegrationDoc | null> {
  const snap = await getDoc(integrationMainRef(db, uid, dreamId));
  return snap.exists() ? snap.data() : null;
}

export async function upsertIntegration(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  data: IntegrationDoc
): Promise<void> {
  await setDoc(integrationMainRef(db, uid, dreamId), data, { merge: true });
}

/** Update journal text only (most common UI edit) */
export async function updateIntegrationJournal(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  journalText: string
): Promise<void> {
  await setDoc(
    integrationMainRef(db, uid, dreamId),
    { journalText, updatedAt: nowTs() },
    { merge: true }
  );
}

/** -----------------------------
 *  Session aggregate (read)
 *  ----------------------------- */

export async function getDreamSession(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<DreamSession | null> {
  const dream = await getDream(db, uid, dreamId);
  if (!dream) return null;

  const [elements, associations, hypotheses, integration] = await Promise.all([
    listElements(db, uid, dreamId, { includeDeleted: false }),
    listAssociations(db, uid, dreamId),
    listHypotheses(db, uid, dreamId),
    getIntegration(db, uid, dreamId),
  ]);

  return {
    dreamId,
    dream,
    elements,
    associations,
    hypotheses,
    integration: integration ? { id: "main", data: integration } : null,
  };
}

/** Subscribe to a whole dream session (simple approach: subscribe to each subcollection) */
export function subscribeDreamSession(
  db: Firestore,
  uid: UID,
  dreamId: DreamId,
  cb: (session: DreamSession | null) => void
): Unsubscribe {
  let latestDream: DreamDoc | null = null;
  let latestElements: DreamSession["elements"] = [];
  let latestAssociations: DreamSession["associations"] = [];
  let latestHypotheses: DreamSession["hypotheses"] = [];
  let latestIntegration: DreamSession["integration"] = null;

  const emit = () => {
    if (!latestDream) {
      cb(null);
      return;
    }
    cb({
      dreamId,
      dream: latestDream,
      elements: latestElements,
      associations: latestAssociations,
      hypotheses: latestHypotheses,
      integration: latestIntegration,
    });
  };

  const unsubDream = onSnapshot(dreamRef(db, uid, dreamId), (s) => {
    latestDream = s.exists() ? s.data() : null;
    emit();
  });

  const unsubElements = onSnapshot(
    elementsCol(db, uid, dreamId),
    (snaps) => {
      latestElements = snaps.docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .filter((e) => !e.data.deleted)
        .sort((a, b) => {
          if (a.data.kind < b.data.kind) return -1;
          if (a.data.kind > b.data.kind) return 1;
          return (a.data.order ?? 0) - (b.data.order ?? 0);
        });
      emit();
    }
  );

  const unsubAssociations = onSnapshot(
    query(associationsCol(db, uid, dreamId), orderBy("createdAt", "asc")),
    (snaps) => {
      latestAssociations = snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
      emit();
    }
  );

  const unsubHypotheses = onSnapshot(
    query(hypothesesCol(db, uid, dreamId), orderBy("createdAt", "asc")),
    (snaps) => {
      latestHypotheses = snaps.docs.map((d) => ({ id: d.id, data: d.data() }));
      emit();
    }
  );

  const unsubIntegration = onSnapshot(integrationMainRef(db, uid, dreamId), (s) => {
    latestIntegration = s.exists() ? { id: "main", data: s.data() } : null;
    emit();
  });

  return () => {
    unsubDream();
    unsubElements();
    unsubAssociations();
    unsubHypotheses();
    unsubIntegration();
  };
}

/** -----------------------------
 *  Status lifecycle helpers
 *  ----------------------------- */

/**
 * Compute the "best effort" status from existing artifacts.
 * Use this if you prefer derived status over explicit writes.
 */
export function deriveDreamStatusFromArtifacts(args: {
  hasElements: boolean;
  hasAnyAssociation: boolean;
  hasHypotheses: boolean;
  hasIntegration: boolean;
}): DreamStatus {
  if (args.hasIntegration) return "integrated";
  if (args.hasHypotheses) return "interpreted";
  if (args.hasAnyAssociation) return "associated";
  if (args.hasElements) return "structured";
  return "draft";
}

/**
 * Optionally keep dream.status in sync by reading subcollections in a transaction.
 * Use sparingly (it reads multiple collections). MVP can also just set status at write points.
 */
export async function syncDreamStatus(
  db: Firestore,
  uid: UID,
  dreamId: DreamId
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const dref = doc(db, paths.dream(uid, dreamId));
    const dSnap = await tx.get(dref);
    if (!dSnap.exists()) return;

    // Minimal reads: count presence by fetching first doc of each subcollection
    const [els, assocs, hyps, integ] = await Promise.all([
      getDocs(query(collection(db, paths.elements(uid, dreamId)), limit(1))),
      getDocs(query(collection(db, paths.associations(uid, dreamId)), limit(1))),
      getDocs(query(collection(db, paths.hypotheses(uid, dreamId)), limit(1))),
      tx.get(doc(db, paths.integrationMain(uid, dreamId))),
    ]);

    const status = deriveDreamStatusFromArtifacts({
      hasElements: !els.empty,
      hasAnyAssociation: !assocs.empty,
      hasHypotheses: !hyps.empty,
      hasIntegration: integ.exists(),
    });

    tx.update(dref, { status, updatedAt: nowTs() });
  });
}
