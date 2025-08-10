const { Router } = require('express');
const provisioner = require('../serverProvisioner');

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.post('/servers', async (req, res) => {
  try {
    const { version = "1.21.1", type = "paper", memoryMb = 2048 } = req.body || {};
    const out = await provisioner.requestCreate({ version, type, memoryMb });
    res.status(202).json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'create_failed' });
  }
});

router.post('/servers/:id/stop', async (req, res) => {
  try {
    const out = await provisioner.requestStop({ id: req.params.id });
    res.status(202).json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'stop_failed' });
  }
});

module.exports = router;
