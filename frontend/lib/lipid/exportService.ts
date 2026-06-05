import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getAllSamples, SampleRecord } from './storageService';

export async function exportDataset(sessionConfig: any = {}) {
  const samples = await getAllSamples();
  const zip = new JSZip();
  const dataset = zip.folder('dataset');

  if (!dataset) return;

  const byChar: Record<string, SampleRecord[]> = {};
  for (const s of samples) {
    byChar[s.characterId] = byChar[s.characterId] || [];
    byChar[s.characterId].push(s);
  }

  for (const [charId, items] of Object.entries(byChar)) {
    const folder = dataset.folder(charId);
    if (!folder) continue;
    for (const it of items) {
      folder.file(it.filename, it.imageBlob);
    }
  }

  const metadata = {
    dataset_name: 'LiPi Handwriting Dataset',
    language: 'Odia',
    created_at: new Date().toISOString(),
    total_samples: samples.length,
  };
  dataset.file('metadata.json', JSON.stringify(metadata, null, 2));

  const contributor = {
    name: sessionConfig.name || '',
    contributorId: sessionConfig.contributorId || '',
    sessionId: sessionConfig.sessionId || 'S01',
    mode: sessionConfig.mode || '',
  };
  dataset.file('contributor.json', JSON.stringify(contributor, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  const uniqueChars = Object.keys(byChar).length;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const contribPart = sessionConfig && sessionConfig.contributorId ? `_${sessionConfig.contributorId}` : '';
  const filename = `LiPi_Dataset${contribPart}_${uniqueChars}chars_${dateStr}_${timeStr}.zip`;
  saveAs(content, filename);
  try {
    if (sessionConfig && sessionConfig.contributorId) {
      const key = `lipi_last_export_ts_${sessionConfig.contributorId}_${sessionConfig.sessionId || 'S01'}`;
      try { localStorage.setItem(key, new Date().toISOString()); } catch (e) {}
    }
  } catch (e) {}
}
