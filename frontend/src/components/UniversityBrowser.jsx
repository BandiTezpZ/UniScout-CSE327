import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CircleDollarSign, ExternalLink, GraduationCap, Heart, Info, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const money = value => `$${Math.round(Number(value || 0) / 1000)}K`;
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=800'
];

const MATCH_BADGE_STYLES = {
  Reach: 'border-rose-200 bg-rose-50 text-rose-700',
  Target: 'border-amber-200 bg-amber-50 text-amber-700',
  Safety: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

function fallbackImage(name = '') {
  const index = Math.abs(String(name).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % DEFAULT_IMAGES.length;
  return DEFAULT_IMAGES[index];
}

function UniversityImage({ university }) {
  const [hasError, setHasError] = useState(false);
  const src = !hasError && university.imageUrl ? university.imageUrl : fallbackImage(university.university_name || university.universityName);
  return <div className="absolute inset-0 bg-slate-50"><img src={src} alt={`${university.university_name || university.universityName} campus`} className="h-full w-full object-cover" loading="lazy" onError={() => setHasError(true)} /></div>;
}

function SaveButton({ saved, onClick, label = 'College' }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-extrabold shadow-md transition-all ${saved ? 'border-brandBlue bg-brandBlue text-white' : 'border-gray-900 bg-white text-gray-900 hover:bg-gray-50'}`}>
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
      <span>{saved ? `Saved ${label}` : `Save ${label}`}</span>
    </button>
  );
}

function LocalUniversityCard({ university, onToggle }) {
  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:grid-cols-[1fr_280px]">
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-brandNavy underline decoration-1 underline-offset-2">{university.university_name} <span aria-hidden="true">→</span></h3>
            <p className="mt-2 text-sm text-gray-600">{university.state}, {university.country}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-brandBlue">Tier {university.rank_tier}</span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-bold text-gray-600">From UniScout Database</span>
          </div>
        </div>
        <div className="my-5 border-t border-dashed border-gray-200" />
        <div className="grid gap-3 text-sm text-brandNavy">
          <div className="flex items-center gap-4"><Info size={17} className="text-brandBlue" /><span>{university.program} · Research level {university.research_level} · {university.research_category}</span></div>
          <div className="flex items-center gap-4"><GraduationCap size={17} className="text-brandBlue" /><span><b>{Number(university.min_cgpa || 0).toFixed(1)}</b> min CGPA · <b>{university.min_ielts}</b> IELTS · <b>{university.min_gre}</b> GRE</span></div>
          <div className="flex items-center gap-4"><CircleDollarSign size={17} className="text-brandBlue" /><span><b>{money(university.cost_of_attendance_usd)}</b> estimated annual attendance · {money(university.tuition_usd)} tuition</span></div>
          <div className="flex items-center gap-4"><BookOpen size={17} className="text-brandBlue" /><span>{university.intake} intake · Deadline: <b>{university.deadline}</b></span></div>
        </div>
      </div>
      <div className="relative min-h-[230px]">
        <UniversityImage university={university} />
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2"><SaveButton saved={university.saved} onClick={() => onToggle(university)} /></div>
      </div>
    </article>
  );
}

function FactBox({ title, lines }) {
  return <div className="rounded-lg border border-gray-100 bg-gray-50 p-4"><h4 className="text-xs font-extrabold uppercase text-brandNavy">{title}</h4><ul className="mt-2 space-y-1 text-sm text-brandSlate">{lines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}</ul></div>;
}

function AiUniversityCard({ university, onToggle }) {
  const sources = university.sources || [];
  const matchCategory = university.matchCategory;
  const badgeStyle = MATCH_BADGE_STYLES[matchCategory] || 'border-blue-100 bg-blue-50 text-brandBlue';
  return (
    <article className="rounded-lg border border-blue-100 bg-white p-7 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold ${badgeStyle}`}><Sparkles size={13} /> {matchCategory ? `${matchCategory} Match` : 'AI Suggested'}</div>
          <h3 className="text-2xl font-extrabold text-brandNavy">{university.universityName || university.university_name}</h3>
          <p className="mt-1 text-base font-bold text-brandSlate">{university.programName || university.program}</p>
          <p className="mt-1 text-sm text-gray-500">{university.stateOrRegion || university.state}{university.country ? `, ${university.country}` : ''}</p>
        </div>
        <SaveButton saved={university.saved} onClick={() => onToggle(university)} label="University" />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section><h4 className="text-xs font-extrabold uppercase text-brandNavy">Why Suggested</h4><p className="mt-2 text-sm leading-relaxed text-brandSlate">{university.whySuggested || 'Suggested from the UniScout catalogue using your factual profile details.'}</p></section>
        <section><h4 className="text-xs font-extrabold uppercase text-brandNavy">Relevant Areas</h4><div className="mt-2 flex flex-wrap gap-2">{(university.relevantResearchAreas || []).length ? university.relevantResearchAreas.map(area => <span key={area} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brandBlue">{area}</span>) : <span className="text-sm text-gray-500">Not clearly stated</span>}</div></section>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <FactBox title="Catalogue Requirements" lines={[`CGPA: ${university.requirements?.cgpa || 'Unknown'}`, `GRE: ${university.requirements?.gre || 'Unknown'}`, `English: ${university.requirements?.english || 'Unknown'}`]} />
        <FactBox title="Funding" lines={[university.funding?.status || 'Unknown', university.funding?.details || 'Verify with department']} />
        <FactBox title="Things to Check" lines={(university.importantNotes || ['Confirm deadline and funding details on the official site']).slice(0, 3)} />
      </div>
      {sources.length > 0 && <div className="mt-5 border-t border-gray-100 pt-4"><h4 className="text-xs font-extrabold uppercase text-brandNavy">Sources</h4><div className="mt-2 flex flex-wrap gap-3">{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-brandBlue hover:underline">{source.title || 'Official source'} <ExternalLink size={13} /></a>)}</div></div>}
    </article>
  );
}

export default function UniversityBrowser({ mode = 'browse' }) {
  const [universities, setUniversities] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rank_asc');
  const [loading, setLoading] = useState(mode !== 'suggested');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const title = mode === 'saved' ? 'Saved Universities' : mode === 'suggested' ? 'Suggested Universities' : 'College Search';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = mode === 'saved' ? await api.getSavedUniversities() : mode === 'suggested' ? await api.getSuggestedUniversities() : await api.getUniversities({ q: query, sort });
      let results = data.universities || [];
      if (mode === 'saved' && query) {
        const lowerQ = query.toLowerCase();
        results = results.filter(u => String(u.university_name || u.universityName || '').toLowerCase().includes(lowerQ) || String(u.program || u.programName || '').toLowerCase().includes(lowerQ));
      }
      setUniversities(results);
      setStatusMessage(data.message || '');
      setSavedCount(data.savedCount ?? (mode === 'saved' ? results.length : data.total) ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, mode === 'suggested' ? 0 : 250);
    return () => window.clearTimeout(timer);
  }, [query, sort, mode]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    setStatusMessage('');
    try {
      const data = await api.generateSuggestedUniversities();
      setUniversities(data.universities || []);
      setStatusMessage(data.message || (data.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleString()}` : ''));
    } catch (err) {
      setError(err.message || 'AI catalogue recommendations are temporarily unavailable. You can still browse universities manually.');
    } finally {
      setGenerating(false);
    }
  };

  const programs = useMemo(() => [...new Set(universities.map(item => item.program).filter(Boolean))].slice(0, 6), [universities]);

  const toggleSaved = async (university) => {
    const nextSaved = !university.saved;
    const id = university.id;
    setUniversities(items => items.map(item => item.id === id ? { ...item, saved: nextSaved } : item));
    setSavedCount(count => Math.max(0, count + (nextSaved ? 1 : -1)));
    try {
      if (String(university.source || '').startsWith('ai_')) {
        if (nextSaved) await api.saveAiUniversity(university);
        else await api.removeSavedAiUniversity(id);
      } else if (nextSaved) await api.saveUniversity(id);
      else await api.removeSavedUniversity(id);
      if (mode === 'saved' && !nextSaved) setUniversities(items => items.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to update shortlist');
      load();
    }
  };

  return (
    <section className="col-span-full min-h-[calc(100vh-8rem)] bg-white text-gray-950">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 bg-brandBlue/5 border border-brandBlue/20 p-5 rounded-2xl">
            {mode !== 'suggested' && <h2 className="text-2xl font-extrabold underline decoration-2 underline-offset-4">{title}</h2>}
            {mode === 'suggested' && (
              <>
                <Sparkles size={28} className="text-brandBlue shrink-0" />
                <p className="max-w-3xl text-base font-medium text-brandNavy leading-relaxed">
                  Based on your CV and preferences, Gemini AI analyzes UniScout's local university catalogue and explains the programmes worth investigating.
                </p>
              </>
            )}
          </div>
          {mode !== 'suggested' && <div className="flex flex-1 items-center justify-center"><label className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by college name" className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/15" /></label></div>}
          <div className="flex items-center gap-2 text-sm font-bold"><Heart size={18} /><span>Saved ({savedCount})</span></div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        {mode === 'suggested' ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-lg"><b>{universities.length}</b> AI suggested programs</p><button onClick={generate} disabled={generating} className="rounded-xl bg-brandBlue px-5 py-3 text-sm font-extrabold text-white shadow-md disabled:opacity-60">{generating ? 'Analyzing...' : universities.length ? 'Refresh Recommendations' : 'Find Universities'}</button></div> : <div className="flex items-center justify-between"><p className="text-lg"><b>{universities.length}</b> Colleges found</p><label className="flex items-center gap-2 text-sm"><SlidersHorizontal size={16} /><select value={sort} onChange={event => setSort(event.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-1"><option value="rank_asc">Rank (High to Low)</option><option value="rank_desc">Rank (Low to High)</option><option value="cost_asc">Cost (Low to High)</option><option value="cost_desc">Cost (High to Low)</option><option value="subject_asc">Subject (A to Z)</option><option value="subject_desc">Subject (Z to A)</option></select></label></div>}
        {programs.length > 0 && mode === 'browse' && <div className="flex flex-wrap gap-2">{programs.map(program => <button key={program} type="button" onClick={() => setQuery(query === program ? '' : program)} className={`rounded-full px-3 py-1 text-xs font-bold ${query === program ? 'bg-brandBlue text-white' : 'bg-blue-50 text-brandBlue hover:bg-blue-100'}`}>{program}</button>)}</div>}
        {statusMessage && <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-brandBlue">{statusMessage}</div>}
        {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</div>}
        {loading || generating ? <div className="py-20 text-center text-sm font-bold text-gray-500">{generating ? 'Analyzing the local catalogue using your profile...' : 'Loading universities...'}</div> : universities.length === 0 ? <div className="py-20 text-center text-sm font-bold text-gray-500">{mode === 'suggested' ? 'No universities in the catalogue realistically match your current profile. Consider broadening your criteria or browsing manually.' : 'No universities match this view.'}</div> : <div className="space-y-5">{universities.map(university => String(university.source || '').startsWith('ai_') ? <AiUniversityCard key={university.id} university={university} onToggle={toggleSaved} /> : <LocalUniversityCard key={university.id} university={university} onToggle={toggleSaved} />)}</div>}
      </div>
    </section>
  );
}
