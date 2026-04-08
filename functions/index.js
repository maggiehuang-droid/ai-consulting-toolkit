const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

const WORKSHOPS = "du0c9a_workshops";
const GROUPS = "du0c9a_groups";
const MEMBERS = "du0c9a_members";
const SESSIONS = "du0c9a_sessions";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Helper: snapshot → array of docs with id
function docs(snapshot) {
  const result = [];
  snapshot.forEach((doc) => result.push({ id: doc.id, ...doc.data() }));
  return result;
}

// ── workshops ─────────────────────────────────────────────────────────────────

app.get("/api/workshops", async (_req, res) => {
  const snap = await db.collection(WORKSHOPS).orderBy("created_at", "desc").get();
  res.json(docs(snap));
});

app.post("/api/workshops", async (req, res) => {
  const data = {
    title: req.body.title || "未命名工作坊",
    description: req.body.description || "",
    client_name: req.body.client_name || "",
    date: req.body.date || "",
    notes: req.body.notes || "",
    hubspot_url: req.body.hubspot_url || "",
    status: "active",
    created_at: new Date().toISOString(),
  };
  const ref = await db.collection(WORKSHOPS).add(data);
  res.status(201).json({ id: ref.id, ...data });
});

app.get("/api/workshops/:id", async (req, res) => {
  const doc = await db.collection(WORKSHOPS).doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Workshop not found" });

  const groups = docs(
    await db.collection(GROUPS).where("workshop_id", "==", req.params.id).get()
  );
  const members = docs(
    await db.collection(MEMBERS).where("workshop_id", "==", req.params.id).get()
  );

  const groupsWithMeta = groups.map((g) => {
    const gm = members.filter((m) => m.group_id === g.id);
    const leader = gm.find((m) => m.is_leader);
    return { ...g, member_count: gm.length, leader_name: leader?.name || "" };
  });
  res.json({ id: doc.id, ...doc.data(), groups: groupsWithMeta });
});

app.put("/api/workshops/:id", async (req, res) => {
  const ref = db.collection(WORKSHOPS).doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Workshop not found" });

  const allowed = ["title", "description", "client_name", "date", "notes", "hubspot_url"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  await ref.update(update);
  const updated = await ref.get();
  res.json({ id: updated.id, ...updated.data() });
});

app.delete("/api/workshops/:id", async (req, res) => {
  await db.collection(WORKSHOPS).doc(req.params.id).delete();
  res.json({ ok: true });
});

// ── groups ────────────────────────────────────────────────────────────────────

app.post("/api/workshops/:id/groups", async (req, res) => {
  const wsDoc = await db.collection(WORKSHOPS).doc(req.params.id).get();
  if (!wsDoc.exists) return res.status(404).json({ error: "Workshop not found" });

  const existingSnap = await db
    .collection(GROUPS)
    .where("workshop_id", "==", req.params.id)
    .get();
  const workshopGroups = docs(existingSnap);

  const code = req.body.group_code || "";
  if (code && workshopGroups.find((g) => g.group_code === code)) {
    return res.status(409).json({ error: `group_code "${code}" 已存在於此工作坊` });
  }

  let group_code = code;
  if (!group_code) {
    const nums = workshopGroups
      .map((g) => {
        const m = (g.group_code || "").match(/^G(\d+)$/);
        return m ? parseInt(m[1]) : 0;
      })
      .filter((n) => n > 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    group_code = `G${String(next).padStart(2, "0")}`;
  }

  const data = {
    workshop_id: req.params.id,
    group_code,
    name: req.body.name || "未命名小組",
    facilitator: req.body.facilitator || "",
    access_token: crypto.randomUUID().slice(0, 8),
    created_at: new Date().toISOString(),
  };
  const ref = await db.collection(GROUPS).add(data);
  res.status(201).json({ id: ref.id, ...data });
});

app.get("/api/workshops/:id/groups", async (req, res) => {
  const snap = await db
    .collection(GROUPS)
    .where("workshop_id", "==", req.params.id)
    .get();
  res.json(docs(snap));
});

app.get("/api/workshops/:workshopId/groups/:groupId", async (req, res) => {
  const doc = await db.collection(GROUPS).doc(req.params.groupId).get();
  if (!doc.exists) return res.status(404).json({ error: "Group not found" });
  res.json({ id: doc.id, ...doc.data() });
});

app.put("/api/workshops/:workshopId/groups/:groupId", async (req, res) => {
  const ref = db.collection(GROUPS).doc(req.params.groupId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Group not found" });

  if (req.body.group_code && req.body.group_code !== doc.data().group_code) {
    const conflictSnap = await db
      .collection(GROUPS)
      .where("workshop_id", "==", doc.data().workshop_id)
      .where("group_code", "==", req.body.group_code)
      .get();
    const conflict = docs(conflictSnap).find((g) => g.id !== req.params.groupId);
    if (conflict) {
      return res.status(409).json({ error: `group_code "${req.body.group_code}" 已存在於此工作坊` });
    }
  }

  await ref.update(req.body);
  const updated = await ref.get();
  res.json({ id: updated.id, ...updated.data() });
});

app.delete("/api/workshops/:workshopId/groups/:groupId", async (req, res) => {
  await db.collection(GROUPS).doc(req.params.groupId).delete();
  // also remove members of this group
  const memberSnap = await db
    .collection(MEMBERS)
    .where("group_id", "==", req.params.groupId)
    .get();
  const batch = db.batch();
  memberSnap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  res.json({ ok: true });
});

app.get("/api/groups/by-token/:accessToken", async (req, res) => {
  const snap = await db
    .collection(GROUPS)
    .where("access_token", "==", req.params.accessToken)
    .get();
  if (snap.empty) return res.status(404).json({ error: "Group not found" });
  const doc = snap.docs[0];
  res.json({ id: doc.id, ...doc.data() });
});

// ── bulk import ───────────────────────────────────────────────────────────────

app.post("/api/workshops/:id/members-bulk", async (req, res) => {
  const workshopId = req.params.id;
  const force = req.query.force === "true";
  const rows = req.body.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "匯入資料不可為空" });
  }

  // check sessions
  const sessionsSnap = await db
    .collection(SESSIONS)
    .where("workshop_id", "==", workshopId)
    .get();
  if (!sessionsSnap.empty) {
    return res.status(409).json({
      error: "HAS_SESSIONS",
      message: "此工作坊已有步驟作答資料，無法重新匯入分組。請建立新工作坊，或先清除既有分析資料。",
    });
  }

  // check existing groups
  const existingSnap = await db
    .collection(GROUPS)
    .where("workshop_id", "==", workshopId)
    .get();
  const existingGroups = docs(existingSnap);
  if (existingGroups.length > 0 && !force) {
    return res.status(409).json({
      error: "HAS_GROUPS",
      message: "此工作坊已存在小組，請確認是否清空並重新匯入。",
      groupCount: existingGroups.length,
    });
  }

  // validate rows
  const errors = [];
  const codeNameMap = {};
  rows.forEach((r, i) => {
    if (!r.group_code) errors.push(`第 ${i + 2} 列：group_code 必填`);
    if (!r.group_name) errors.push(`第 ${i + 2} 列：group_name 必填`);
    if (!r.name) errors.push(`第 ${i + 2} 列：name 必填`);
    if (r.group_code && r.group_name) {
      if (codeNameMap[r.group_code] && codeNameMap[r.group_code] !== r.group_name) {
        errors.push(
          `group_code "${r.group_code}" 對應到不同 group_name（"${codeNameMap[r.group_code]}" vs "${r.group_name}"）`
        );
      }
      codeNameMap[r.group_code] = r.group_name;
    }
  });
  if (errors.length) return res.status(400).json({ error: errors.join("；") });

  // clear existing if force
  if (force && existingGroups.length > 0) {
    const batch = db.batch();
    existingSnap.forEach((doc) => batch.delete(doc.ref));
    const memberSnap = await db
      .collection(MEMBERS)
      .where("workshop_id", "==", workshopId)
      .get();
    memberSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  // build groups
  const newGroups = {};
  rows.forEach((r) => {
    if (!newGroups[r.group_code]) {
      newGroups[r.group_code] = {
        workshop_id: workshopId,
        group_code: r.group_code,
        name: r.group_name,
        facilitator: "",
        access_token: crypto.randomUUID().slice(0, 8),
        created_at: new Date().toISOString(),
      };
    }
  });

  // write groups
  const groupIdMap = {};
  const createdGroups = [];
  for (const [code, data] of Object.entries(newGroups)) {
    const ref = await db.collection(GROUPS).add(data);
    groupIdMap[code] = ref.id;
    createdGroups.push({ id: ref.id, ...data });
  }

  // write members
  const batch = db.batch();
  let memberCount = 0;
  for (const r of rows) {
    const ref = db.collection(MEMBERS).doc();
    batch.set(ref, {
      group_id: groupIdMap[r.group_code],
      workshop_id: workshopId,
      name: r.name,
      title: r.title || "",
      seniority: r.seniority || "",
      department: r.department || "",
      is_leader: ["true", "1", "yes", "是", true].includes(r.is_leader),
      created_at: new Date().toISOString(),
    });
    memberCount++;
  }
  await batch.commit();

  res.status(201).json({ groups: createdGroups, memberCount });
});

app.post("/api/workshops/:id/clear-groups", async (req, res) => {
  const workshopId = req.params.id;

  const sessionsSnap = await db
    .collection(SESSIONS)
    .where("workshop_id", "==", workshopId)
    .get();
  if (!sessionsSnap.empty) {
    return res.status(409).json({
      error: "HAS_SESSIONS",
      message: "此工作坊已有步驟作答資料，無法清除分組。",
    });
  }

  const groupSnap = await db
    .collection(GROUPS)
    .where("workshop_id", "==", workshopId)
    .get();
  const memberSnap = await db
    .collection(MEMBERS)
    .where("workshop_id", "==", workshopId)
    .get();

  const batch = db.batch();
  groupSnap.forEach((doc) => batch.delete(doc.ref));
  memberSnap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  res.json({ ok: true, removed: groupSnap.size });
});

// ── members ───────────────────────────────────────────────────────────────────

app.get("/api/workshops/:wid/groups/:gid/members", async (req, res) => {
  const snap = await db
    .collection(MEMBERS)
    .where("group_id", "==", req.params.gid)
    .get();
  res.json(docs(snap));
});

app.post("/api/workshops/:wid/groups/:gid/members", async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "姓名必填" });

  const data = {
    group_id: req.params.gid,
    workshop_id: req.params.wid,
    name,
    title: req.body.title || "",
    seniority: req.body.seniority || "",
    department: req.body.department || "",
    is_leader: !!req.body.is_leader,
    created_at: new Date().toISOString(),
  };
  const ref = await db.collection(MEMBERS).add(data);
  res.status(201).json({ id: ref.id, ...data });
});

app.put("/api/workshops/:wid/groups/:gid/members/:memberId", async (req, res) => {
  const ref = db.collection(MEMBERS).doc(req.params.memberId);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ error: "Member not found" });
  const { id, ...body } = req.body;
  await ref.update(body);
  const updated = await ref.get();
  res.json({ id: updated.id, ...updated.data() });
});

app.delete("/api/workshops/:wid/groups/:gid/members/:memberId", async (req, res) => {
  await db.collection(MEMBERS).doc(req.params.memberId).delete();
  res.json({ ok: true });
});

// ── sessions ──────────────────────────────────────────────────────────────────

app.get("/api/sessions/:workshopId/:groupId", async (req, res) => {
  const { workshopId, groupId } = req.params;
  const snap = await db
    .collection(SESSIONS)
    .where("workshop_id", "==", workshopId)
    .where("group_id", "==", groupId)
    .get();
  res.json(docs(snap));
});

app.put("/api/sessions/:workshopId/:groupId/:step", async (req, res) => {
  const { workshopId, groupId, step } = req.params;

  // find existing session for this workshop+group+step
  const snap = await db
    .collection(SESSIONS)
    .where("workshop_id", "==", workshopId)
    .where("group_id", "==", groupId)
    .where("step", "==", step)
    .get();

  const data = {
    workshop_id: workshopId,
    group_id: groupId,
    step,
    status: req.body.status || "completed",
    data: req.body.data ?? null,
    updated_at: new Date().toISOString(),
  };

  let id;
  if (!snap.empty) {
    const existing = snap.docs[0];
    await existing.ref.update(data);
    id = existing.id;
  } else {
    const ref = await db.collection(SESSIONS).add(data);
    id = ref.id;
  }
  res.json({ id, ...data });
});

app.get("/api/sessions/:workshopId/:groupId/:step", async (req, res) => {
  const { workshopId, groupId, step } = req.params;
  const snap = await db
    .collection(SESSIONS)
    .where("workshop_id", "==", workshopId)
    .where("group_id", "==", groupId)
    .where("step", "==", step)
    .get();
  if (snap.empty) return res.status(404).json({ error: "Session not found" });
  const doc = snap.docs[0];
  res.json({ id: doc.id, ...doc.data() });
});

// ── export as Cloud Function ──────────────────────────────────────────────────

exports.api = onRequest(
  { region: "asia-east1", cors: true, invoker: "public" },
  app
);
