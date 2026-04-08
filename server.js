import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_VERCEL = !!process.env.VERCEL;
const ORIGINAL_DATA_DIR = join(__dirname, 'data');
const DATA_DIR = IS_VERCEL ? '/tmp' : ORIGINAL_DATA_DIR;

const app = express();
app.use(express.json({ limit: '10mb' }));

// ── helpers ──────────────────────────────────────────────────────────────────

function readJSON(file) {
  const targetPath = join(DATA_DIR, file);
  try {
    return JSON.parse(readFileSync(targetPath, 'utf8'));
  } catch (err) {
    if (IS_VERCEL && err.code === 'ENOENT') {
      try {
        const fallbackPath = join(ORIGINAL_DATA_DIR, file);
        const data = readFileSync(fallbackPath, 'utf8');
        writeFileSync(targetPath, data);
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeJSON(file, data) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ── workshops ─────────────────────────────────────────────────────────────────

app.get('/api/workshops', (_req, res) => {
  res.json(readJSON('workshops.json'));
});

app.post('/api/workshops', (req, res) => {
  const workshops = readJSON('workshops.json');
  const workshop = {
    id: randomUUID(),
    title: req.body.title || '未命名工作坊',
    description: req.body.description || '',
    client_name: req.body.client_name || '',
    date: req.body.date || '',
    notes: req.body.notes || '',
    hubspot_url: req.body.hubspot_url || '',
    status: 'active',
    created_at: new Date().toISOString(),
  };
  workshops.push(workshop);
  writeJSON('workshops.json', workshops);
  res.status(201).json(workshop);
});

app.get('/api/workshops/:id', (req, res) => {
  const workshop = readJSON('workshops.json').find(w => w.id === req.params.id);
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
  const groups = readJSON('groups.json').filter(g => g.workshop_id === req.params.id);
  // attach member counts + leader name
  const members = readJSON('members.json');
  const groupsWithMeta = groups.map(g => {
    const gm = members.filter(m => m.group_id === g.id);
    const leader = gm.find(m => m.is_leader);
    return { ...g, member_count: gm.length, leader_name: leader?.name || '' };
  });
  res.json({ ...workshop, groups: groupsWithMeta });
});

app.put('/api/workshops/:id', (req, res) => {
  const workshops = readJSON('workshops.json');
  const idx = workshops.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workshop not found' });
  // only allow safe fields to be updated
  const { title, description, client_name, date, notes, hubspot_url } = req.body;
  if (title !== undefined) workshops[idx].title = title;
  if (description !== undefined) workshops[idx].description = description;
  if (client_name !== undefined) workshops[idx].client_name = client_name;
  if (date !== undefined) workshops[idx].date = date;
  if (notes !== undefined) workshops[idx].notes = notes;
  if (hubspot_url !== undefined) workshops[idx].hubspot_url = hubspot_url;
  writeJSON('workshops.json', workshops);
  res.json(workshops[idx]);
});

app.delete('/api/workshops/:id', (req, res) => {
  let workshops = readJSON('workshops.json');
  workshops = workshops.filter(w => w.id !== req.params.id);
  writeJSON('workshops.json', workshops);
  res.json({ ok: true });
});

// ── projects ──────────────────────────────────────────────────────────────────

app.get('/api/projects', (req, res) => {
  const workshops = readJSON('workshops.json');
  const projects = readJSON('projects.json');
  
  function getProjectName(title) {
    if (!title) return '未命名專案';
    const parts = title.split('-');
    if (parts.length > 1) {
      return parts.slice(1).join('-').trim();
    }
    return title.trim();
  }

  const projectMap = {};
  
  workshops.forEach(w => {
    const projectName = getProjectName(w.title);
    if (!projectMap[projectName]) {
      const savedData = projects.find(p => p.id === projectName) || {};
      projectMap[projectName] = {
        id: projectName,
        title: projectName,
        workshops: [],
        date: w.date,
        project_amount: savedData.project_amount || 0,
        completed_tasks: savedData.completed_tasks || [],
        completed_outputs: savedData.completed_outputs || [],
        project_status: savedData.project_status || 'planning'
      };
    }
    projectMap[projectName].workshops.push({ id: w.id, title: w.title, date: w.date });
  });
  
  res.json(Object.values(projectMap));
});

app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const workshops = readJSON('workshops.json');
  
  function getProjectName(title) {
    if (!title) return '未命名專案';
    const parts = title.split('-');
    if (parts.length > 1) {
      return parts.slice(1).join('-').trim();
    }
    return title.trim();
  }

  const relatedWorkshops = workshops.filter(w => getProjectName(w.title) === projectId);
  
  if (relatedWorkshops.length === 0) return res.status(404).json({ error: 'Project not found' });
  
  const projects = readJSON('projects.json');
  const savedData = projects.find(p => p.id === projectId) || {};
  
  res.json({
    id: projectId,
    title: projectId,
    workshops: relatedWorkshops,
    date: relatedWorkshops[0].date,
    project_amount: savedData.project_amount || 0,
    completed_tasks: savedData.completed_tasks || [],
    completed_outputs: savedData.completed_outputs || [],
    project_status: savedData.project_status || 'planning'
  });
});

app.put('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const projects = readJSON('projects.json');
  const idx = projects.findIndex(p => p.id === projectId);
  
  const newProjectData = {
    id: projectId,
    project_amount: req.body.project_amount ?? 0,
    completed_tasks: req.body.completed_tasks ?? [],
    completed_outputs: req.body.completed_outputs ?? [],
    project_status: req.body.project_status ?? 'planning',
    updated_at: new Date().toISOString()
  };

  if (idx === -1) {
    projects.push(newProjectData);
  } else {
    projects[idx] = { ...projects[idx], ...newProjectData };
  }
  
  writeJSON('projects.json', projects);
  res.json(newProjectData);
});

// ── groups ────────────────────────────────────────────────────────────────────

app.post('/api/workshops/:id/groups', (req, res) => {
  const workshops = readJSON('workshops.json');
  if (!workshops.find(w => w.id === req.params.id)) {
    return res.status(404).json({ error: 'Workshop not found' });
  }
  const groups = readJSON('groups.json');
  const workshopGroups = groups.filter(g => g.workshop_id === req.params.id);

  // validate group_code uniqueness within workshop
  const code = req.body.group_code || '';
  if (code && workshopGroups.find(g => g.group_code === code)) {
    return res.status(409).json({ error: `group_code "${code}" 已存在於此工作坊` });
  }

  // auto-generate group_code if not supplied
  let group_code = code;
  if (!group_code) {
    const nums = workshopGroups
      .map(g => { const m = (g.group_code || '').match(/^G(\d+)$/); return m ? parseInt(m[1]) : 0; })
      .filter(n => n > 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    group_code = `G${String(next).padStart(2, '0')}`;
  }

  const group = {
    id: randomUUID(),
    workshop_id: req.params.id,
    group_code,
    name: req.body.name || '未命名小組',
    facilitator: req.body.facilitator || '',
    access_token: randomUUID().slice(0, 8),
    created_at: new Date().toISOString(),
  };
  groups.push(group);
  writeJSON('groups.json', groups);
  res.status(201).json(group);
});

app.get('/api/workshops/:id/groups', (req, res) => {
  res.json(readJSON('groups.json').filter(g => g.workshop_id === req.params.id));
});

app.get('/api/workshops/:workshopId/groups/:groupId', (req, res) => {
  const group = readJSON('groups.json').find(g => g.id === req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

app.put('/api/workshops/:workshopId/groups/:groupId', (req, res) => {
  const groups = readJSON('groups.json');
  const idx = groups.findIndex(g => g.id === req.params.groupId);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });
  // validate group_code uniqueness if changing it
  if (req.body.group_code && req.body.group_code !== groups[idx].group_code) {
    const conflict = groups.find(g =>
      g.workshop_id === groups[idx].workshop_id &&
      g.group_code === req.body.group_code &&
      g.id !== req.params.groupId
    );
    if (conflict) return res.status(409).json({ error: `group_code "${req.body.group_code}" 已存在於此工作坊` });
  }
  groups[idx] = { ...groups[idx], ...req.body };
  writeJSON('groups.json', groups);
  res.json(groups[idx]);
});

app.delete('/api/workshops/:workshopId/groups/:groupId', (req, res) => {
  let groups = readJSON('groups.json');
  groups = groups.filter(g => g.id !== req.params.groupId);
  writeJSON('groups.json', groups);
  // also remove their members
  let members = readJSON('members.json');
  members = members.filter(m => m.group_id !== req.params.groupId);
  writeJSON('members.json', members);
  res.json({ ok: true });
});

app.get('/api/groups/by-token/:accessToken', (req, res) => {
  const group = readJSON('groups.json').find(g => g.access_token === req.params.accessToken);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

// ── bulk import ───────────────────────────────────────────────────────────────

// POST /api/workshops/:id/members-bulk
// Body: { rows: [{ group_code, group_name, name, title, seniority, department, is_leader }] }
// Query: ?force=true to clear existing groups first
app.post('/api/workshops/:id/members-bulk', (req, res) => {
  const workshopId = req.params.id;
  const force = req.query.force === 'true';
  const rows = req.body.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: '匯入資料不可為空' });
  }

  // check if workshop has sessions (step responses)
  const sessions = readJSON('sessions.json').filter(s => s.workshop_id === workshopId);
  if (sessions.length > 0) {
    return res.status(409).json({
      error: 'HAS_SESSIONS',
      message: '此工作坊已有步驟作答資料，無法重新匯入分組。請建立新工作坊，或先清除既有分析資料。',
    });
  }

  // check existing groups
  const allGroups = readJSON('groups.json');
  const existingGroups = allGroups.filter(g => g.workshop_id === workshopId);
  if (existingGroups.length > 0 && !force) {
    return res.status(409).json({
      error: 'HAS_GROUPS',
      message: '此工作坊已存在小組，請確認是否清空並重新匯入。',
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
        errors.push(`group_code "${r.group_code}" 對應到不同 group_name（"${codeNameMap[r.group_code]}" vs "${r.group_name}"）`);
      }
      codeNameMap[r.group_code] = r.group_name;
    }
  });
  if (errors.length) return res.status(400).json({ error: errors.join('；') });

  // clear existing groups + members for this workshop if force
  let groups = force ? allGroups.filter(g => g.workshop_id !== workshopId) : allGroups;
  let members = readJSON('members.json');
  if (force) {
    const removedIds = existingGroups.map(g => g.id);
    members = members.filter(m => !removedIds.includes(m.group_id));
  }

  // build groups
  const newGroups = {};
  rows.forEach(r => {
    if (!newGroups[r.group_code]) {
      newGroups[r.group_code] = {
        id: randomUUID(),
        workshop_id: workshopId,
        group_code: r.group_code,
        name: r.group_name,
        facilitator: '',
        access_token: randomUUID().slice(0, 8),
        created_at: new Date().toISOString(),
      };
    }
  });

  const createdGroups = Object.values(newGroups);
  groups = [...groups, ...createdGroups];

  // build members
  const newMembers = rows.map(r => ({
    id: randomUUID(),
    group_id: newGroups[r.group_code].id,
    workshop_id: workshopId,
    name: r.name,
    title: r.title || '',
    seniority: r.seniority || '',
    department: r.department || '',
    is_leader: ['true', '1', 'yes', '是', true].includes(r.is_leader),
    created_at: new Date().toISOString(),
  }));
  members = [...members, ...newMembers];

  writeJSON('groups.json', groups);
  writeJSON('members.json', members);

  res.status(201).json({ groups: createdGroups, memberCount: newMembers.length });
});

// POST /api/workshops/:id/clear-groups — clear groups + members (only if no sessions)
app.post('/api/workshops/:id/clear-groups', (req, res) => {
  const workshopId = req.params.id;
  const sessions = readJSON('sessions.json').filter(s => s.workshop_id === workshopId);
  if (sessions.length > 0) {
    return res.status(409).json({
      error: 'HAS_SESSIONS',
      message: '此工作坊已有步驟作答資料，無法清除分組。',
    });
  }
  const toRemove = readJSON('groups.json').filter(g => g.workshop_id === workshopId).map(g => g.id);
  writeJSON('groups.json', readJSON('groups.json').filter(g => g.workshop_id !== workshopId));
  writeJSON('members.json', readJSON('members.json').filter(m => !toRemove.includes(m.group_id)));
  res.json({ ok: true, removed: toRemove.length });
});

// ── members ───────────────────────────────────────────────────────────────────

// GET /api/workshops/:wid/groups/:gid/members
app.get('/api/workshops/:wid/groups/:gid/members', (req, res) => {
  res.json(readJSON('members.json').filter(m => m.group_id === req.params.gid));
});

// POST /api/workshops/:wid/groups/:gid/members
app.post('/api/workshops/:wid/groups/:gid/members', (req, res) => {
  const members = readJSON('members.json');
  const member = {
    id: randomUUID(),
    group_id: req.params.gid,
    workshop_id: req.params.wid,
    name: req.body.name || '',
    title: req.body.title || '',
    seniority: req.body.seniority || '',
    department: req.body.department || '',
    is_leader: !!req.body.is_leader,
    created_at: new Date().toISOString(),
  };
  if (!member.name.trim()) return res.status(400).json({ error: '姓名必填' });
  members.push(member);
  writeJSON('members.json', members);
  res.status(201).json(member);
});

// PUT /api/workshops/:wid/groups/:gid/members/:memberId
app.put('/api/workshops/:wid/groups/:gid/members/:memberId', (req, res) => {
  const members = readJSON('members.json');
  const idx = members.findIndex(m => m.id === req.params.memberId);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  members[idx] = { ...members[idx], ...req.body, id: members[idx].id };
  writeJSON('members.json', members);
  res.json(members[idx]);
});

// DELETE /api/workshops/:wid/groups/:gid/members/:memberId
app.delete('/api/workshops/:wid/groups/:gid/members/:memberId', (req, res) => {
  let members = readJSON('members.json');
  members = members.filter(m => m.id !== req.params.memberId);
  writeJSON('members.json', members);
  res.json({ ok: true });
});

// ── sessions ──────────────────────────────────────────────────────────────────

app.get('/api/sessions/:workshopId/:groupId', (req, res) => {
  const { workshopId, groupId } = req.params;
  res.json(readJSON('sessions.json').filter(s => s.workshop_id === workshopId && s.group_id === groupId));
});

app.put('/api/sessions/:workshopId/:groupId/:step', (req, res) => {
  const { workshopId, groupId, step } = req.params;
  const sessions = readJSON('sessions.json');
  const idx = sessions.findIndex(s => s.workshop_id === workshopId && s.group_id === groupId && s.step === step);
  const session = {
    id: idx >= 0 ? sessions[idx].id : randomUUID(),
    workshop_id: workshopId, group_id: groupId, step,
    status: req.body.status || 'completed',
    data: req.body.data ?? null,
    updated_at: new Date().toISOString(),
  };
  if (idx >= 0) sessions[idx] = session; else sessions.push(session);
  writeJSON('sessions.json', sessions);
  res.json(session);
});

app.get('/api/sessions/:workshopId/:groupId/:step', (req, res) => {
  const { workshopId, groupId, step } = req.params;
  const session = readJSON('sessions.json').find(s => s.workshop_id === workshopId && s.group_id === groupId && s.step === step);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// ── start ─────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
  const distPath = join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running at http://localhost:${PORT}`));
}

export default app;
