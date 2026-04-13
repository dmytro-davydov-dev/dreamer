/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const PROJECT_ID = "demo-dreamer-rules";
let testEnv: RulesTestEnvironment;
const hasFirestoreEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const loadRules = (): string =>
  readFileSync(join(process.cwd(), "firestore.rules"), "utf8");

const authedDb = (uid: string) =>
  testEnv.authenticatedContext(uid).firestore();

const unauthedDb = () =>
  testEnv.unauthenticatedContext().firestore();

const describeWithEmulator = hasFirestoreEmulator ? describe : describe.skip;

describeWithEmulator("firestore.rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: loadRules(),
        host: "127.0.0.1",
        port: 8080,
      },
    });
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it("allows authenticated users to read and write only their own subtree", async () => {
    const ownerRef = doc(authedDb("alice"), "users/alice/dreams/dream-1");
    const foreignRef = doc(authedDb("bob"), "users/alice/dreams/dream-1");

    await assertSucceeds(
      setDoc(ownerRef, {
        rawText: "A river and a staircase.",
        status: "draft",
      })
    );
    await assertSucceeds(getDoc(ownerRef));

    await assertFails(getDoc(foreignRef));
    await assertFails(setDoc(foreignRef, { rawText: "Should not write" }));
  });

  it("denies unauthenticated reads and writes", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice/dreams/dream-2"), {
        rawText: "Seeded by admin context",
      });
    });

    const anonymousRef = doc(unauthedDb(), "users/alice/dreams/dream-2");

    await assertFails(getDoc(anonymousRef));
    await assertFails(setDoc(anonymousRef, { rawText: "Anonymous write" }));
  });

  it("denies writes containing BYOK key material fields", async () => {
    const rootDocRef = doc(authedDb("alice"), "users/alice");
    const dreamRef = doc(authedDb("alice"), "users/alice/dreams/dream-3");

    await assertFails(
      setDoc(dreamRef, {
        rawText: "Dream text",
        llmApiKey: "sk-test-value",
      })
    );

    await assertFails(
      setDoc(rootDocRef, {
        settings: {
          language: "en",
          apiKey: "sk-test-value",
        },
      })
    );

    await assertSucceeds(
      setDoc(rootDocRef, {
        settings: {
          language: "en",
        },
      })
    );
  });
});
