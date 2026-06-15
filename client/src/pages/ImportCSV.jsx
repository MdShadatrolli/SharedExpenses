import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ImportCSV() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [importStats, setImportStats] = useState({
    totalRecords: 0,
    imported: 0,
    autoFixed: 0,
    needsReview: 0
  });

  const fetchImports = async () => {
    try {
      const res = await api.get('/imports');
      const list = res.data;
      const total = list.reduce((sum, item) => sum + (item.rowsImported || 0), 0);
      const fixed = list.reduce((sum, item) => sum + (item.autoFixed || 0), 0);
      const review = list.reduce((sum, item) => sum + (item.needsReview || 0), 0);
      setImportStats({
        totalRecords: total,
        imported: total,
        autoFixed: fixed,
        needsReview: review
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
        if (res.data.length > 0) {
          setGroupId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch groups');
      }
    };
    fetchGroups();
    fetchImports();
  }, []);

  const handleCopyTemplate = () => {
    const template = `date,description,amount,paidByEmail,category
2024-06-10,Weekly Groceries,2450.00,aman@splitflow.in,Food
2024-06-11,Electricity Bills,1800.00,priya@splitflow.in,Bills
2024-06-12,Taxi Fare,1200.00,rahul@splitflow.in,Transport`;
    
    navigator.clipboard.writeText(template);
    alert('Sample CSV Template copied to clipboard! Paste it in the input area.');
  };

  const handleLoadSample = () => {
    const sampleData = `date	description	paid_by	amount	currency	split_type	split_with	split_details	notes
01-02-2026	February rent	Aisha	48000	INR	equal	Aisha;Rohan;Priya;Meera		
03-02-2026	Groceries BigBasket	Priya	2340	INR	equal	Aisha;Rohan;Priya;Meera		
05-02-2026	Wifi bill Feb	Rohan	1199	INR	equal	Aisha;Rohan;Priya;Meera		
08-02-2026	Dinner at Marina Bites	Dev	3200	INR	equal	Aisha;Rohan;Priya;Dev		Dev visiting for the weekend
08-02-2026	dinner - marina bites	Dev	3200	INR	equal	Aisha;Rohan;Priya;Dev		
10-02-2026	Electricity Feb	Aisha	1,200	INR	equal	Aisha;Rohan;Priya;Meera		
12-02-2026	Maid salary Feb	Meera	3000	INR	equal	Aisha;Rohan;Priya;Meera		
14-02-2026	Movie night snacks	priya	640	INR	equal	Aisha;Rohan;Priya		Meera skipped
15-02-2026	Cylinder refill	Rohan	899.995	INR	equal	Aisha;Rohan;Priya;Meera		
18-02-2026	Groceries DMart	Priya S	1875	INR	equal	Aisha;Rohan;Priya;Meera		
20-02-2026	Aisha birthday cake	Rohan	1500	INR	unequal	Rohan;Priya;Meera	Rohan 700; Priya 400; Meera 400	Aisha not charged obviously
22-02-2026	House cleaning supplies		780	INR	equal	Aisha;Rohan;Priya;Meera		can't remember who paid
25-02-2026	Rohan paid Aisha back	Rohan	5000	INR		Aisha		this is a settlement not an expense??
28-02-2026	Pizza Friday	Aisha	1440	INR	percentage	Aisha;Rohan;Priya;Meera	Aisha 30%; Rohan 30%; Priya 30%; Meera 20%	percentages might be off
01-03-2026	March rent	Aisha	48000	INR	equal	Aisha;Rohan;Priya;Meera		
03-03-2026	Groceries BigBasket	Meera	2810	INR	equal	Aisha;Rohan;Priya;Meera		
05-03-2026	Wifi bill Mar	Rohan	1199	INR	equal	Aisha;Rohan;Priya;Meera		
08-03-2026	Goa flights	Aisha	32400	INR	equal	Aisha;Rohan;Priya;Dev		trip starts!
09-03-2026	Goa villa booking	Dev	540	USD	equal	Aisha;Rohan;Priya;Dev		booked on intl site
10-03-2026	Beach shack lunch	Rohan	84	USD	equal	Aisha;Rohan;Priya;Dev		
10-03-2026	Scooter rentals	Priya	3600	INR	share	Aisha;Rohan;Priya;Dev	Aisha 1; Rohan 2; Priya 1; Dev 2	Rohan and Dev took the bigger ones
11-03-2026	Parasailing	Dev	150	USD	equal	Aisha;Rohan;Priya;Dev;Dev's friend Kabir		Kabir joined for the day
11-03-2026	Dinner at Thalassa	Aisha	2400	INR	equal	Aisha;Rohan;Priya;Dev		
11-03-2026	Thalassa dinner	Rohan	2450	INR	equal	Aisha;Rohan;Priya;Dev		Aisha also logged this I think hers is wrong
12-03-2026	Parasailing refund	Dev	-30	USD	equal	Aisha;Rohan;Priya;Dev		one slot got cancelled
Mar-14	Airport cab	rohan	1100	INR	equal	Aisha;Rohan;Priya;Dev		
15-03-2026	Groceries DMart	Priya	2105		equal	Aisha;Rohan;Priya;Meera		forgot to set currency
18-03-2026	Electricity Mar	Aisha	1450	INR	equal	Aisha;Rohan;Priya;Meera		
20-03-2026	Maid salary Mar	Meera	3000	INR	equal	Aisha;Rohan;Priya;Meera		
22-03-2026	Dinner order Swiggy	Priya	0	INR	equal	Aisha;Rohan;Priya;Meera		counted twice earlier - fixing later
25-03-2026	Weekend brunch	Meera	2200	INR	percentage	Aisha;Rohan;Priya;Meera	Aisha 30%; Rohan 30%; Priya 30%; Meera 20%	
28-03-2026	Meera farewell dinner	Aisha	4800	INR	equal	Aisha;Rohan;Priya;Meera		Meera moving out Sunday :(
04-05-2026	Deep cleaning service	Rohan	2500	INR	equal	Aisha;Rohan;Priya		is this April 5 or May 4? format is a mess
01-04-2026	April rent	Aisha	48000	INR	share	Aisha;Rohan;Priya	Aisha 2; Rohan 1; Priya 1	Aisha took Meera's room too
02-04-2026	Groceries BigBasket	Priya	2640	INR	equal	Aisha;Rohan;Priya;Meera		oops Meera still in the group list
05-04-2026	Wifi bill Apr	Rohan	1199	INR	equal	Aisha;Rohan;Priya		
08-04-2026	Sam deposit share	Sam	15000	INR	equal	Aisha		Sam moving in! paid Aisha his deposit
10-04-2026	Housewarming drinks	Sam	3100	INR	equal	Aisha;Rohan;Priya;Sam		
12-04-2026	Electricity Apr	Aisha	1380	INR	equal	Aisha;Rohan;Priya;Sam		
15-04-2026	Groceries DMart	Sam	1990	INR	equal	Aisha;Rohan;Priya;Sam		
18-04-2026	Furniture for common room	Aisha	12000	INR	equal	Aisha;Rohan;Priya;Sam	Aisha 1; Rohan 1; Priya 1; Sam 1	split_type says equal but someone added shares anyway
20-04-2026	Maid salary Apr	Priya	3000	INR	equal	Aisha;Rohan;Priya;Sam		`;
    setCsvText(sampleData);
    setError('');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!groupId) {
      setError('Please choose a group first');
      return;
    }
    if (!csvText.trim()) {
      setError('Please enter CSV data');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/imports', {
        groupId: Number(groupId),
        csvText,
      });
      setResult(res.data);
      setCsvText('');
      fetchImports();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to parse CSV file content.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6 fade-up">
      {/* Status Cards Row matching Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Total Records</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-on-surface">{importStats.totalRecords.toLocaleString()}</span>
            <span className="text-secondary text-xs font-bold">{importStats.totalRecords > 0 ? '+100%' : '0%'}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Imported</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-on-surface">{importStats.imported.toLocaleString()}</span>
            <span className="text-primary text-xs font-bold">{importStats.totalRecords > 0 ? '100%' : '0%'}</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-secondary">
          <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Auto Fixed</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-on-surface">{importStats.autoFixed}</span>
            <span className="material-symbols-outlined text-secondary text-sm font-semibold">auto_awesome</span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-error">
          <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Needs Review</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-error">{importStats.needsReview}</span>
            <span className="material-symbols-outlined text-error text-sm font-semibold">warning</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-xs border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-[#6cf8bb]/15 border border-[#006c49]/20 p-5 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <span className="material-symbols-outlined">check_circle</span>
            <span>Import Completed Successfully!</span>
          </div>
          <p>Logged: <strong>{result.fileName}</strong> for <strong>{result.groupName}</strong>. Created {result.rowsImported} transactions.</p>
        </div>
      )}

      {/* Bento Layout Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Paste Area (Replacing Drag & Drop zone visually but keeping text utility) */}
        <form onSubmit={handleImport} className="lg:col-span-8 flex flex-col gap-6 bg-white glass-card p-6 rounded-xl">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-on-surface">Paste CSV contents</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Target Group</label>
                <select
                  required
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2 text-xs outline-none"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* File Drop & Paste Area */}
              {!csvText ? (
                <div className="relative border-2 border-dashed border-outline-variant/60 rounded-xl p-8 flex flex-col items-center justify-center bg-[#fcf8ff] hover:bg-[#f5f2ff] transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (!file.name.endsWith('.csv')) {
                        setError('Please upload a valid CSV file (.csv)');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setCsvText(evt.target.result);
                        setError('');
                      };
                      reader.onerror = () => {
                        setError('Failed to read CSV file');
                      };
                      reader.readAsText(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-primary text-3xl mb-2 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <p className="text-xs font-bold text-on-surface">Click to upload CSV or drag and drop</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">Accepts standard .csv table sheets</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-on-surface-variant">
                    <span className="font-semibold">Review & Edit CSV Content:</span>
                    <button
                      type="button"
                      onClick={() => setCsvText('')}
                      className="text-error hover:underline font-bold text-[10px] uppercase"
                    >
                      Clear File
                    </button>
                  </div>
                  <div className="relative border border-outline-variant/60 rounded-xl p-4 flex flex-col bg-[#fcf8ff]">
                    <textarea
                      required
                      rows={8}
                      className="w-full bg-transparent border-none text-xs font-mono outline-none resize-none transition-all placeholder:text-outline text-on-surface"
                      placeholder="date,description,amount,paidByEmail,category&#10;2024-06-10,Weekly Groceries,2450.00,aman@splitflow.in,Food"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-container text-white disabled:opacity-50 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-semibold">cloud_upload</span>
              <span>Process Upload</span>
            </button>
          </div>
        </form>

        {/* Sidebar details */}
        <div className="lg:col-span-4 glass-card p-6 rounded-xl flex flex-col space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary">info</span>
            <span>CSV Format Guidelines</span>
          </h3>

          <div className="text-[11px] text-on-surface-variant space-y-2 leading-relaxed">
            <p>Paste comma-separated rows. Required header:</p>
            <pre className="p-2 bg-[#eae6f4] rounded-lg font-mono text-[9px] overflow-x-auto text-[#1b1b24]">
              date,description,amount,paidByEmail,category
            </pre>
            <p>Example columns:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><code>date</code>: YYYY-MM-DD</li>
              <li><code>paidByEmail</code>: registered user email</li>
              <li><code>category</code>: Food, Bills, etc.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleCopyTemplate}
            className="w-full bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs py-2 rounded-xl border border-primary/20 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm font-semibold">content_copy</span>
            <span>Copy Template</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className="w-full bg-secondary/5 hover:bg-secondary/10 text-secondary font-bold text-xs py-2 rounded-xl border border-secondary/20 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm font-semibold">cloud_sync</span>
            <span>Load SharedExpenses Sheet</span>
          </button>
        </div>

      </div>
    </div>
  );
}
