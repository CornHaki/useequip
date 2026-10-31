import React, { useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import EquipmentCard from '../../components/features/EquipmentCard';
import { useEquipment } from '../../hooks/useEquipment';
import { useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { Search } from 'lucide-react';

export default function BrowseEquipment() {
  const { resources } = useEquipment();
  const { loading } = useContext(DataContext);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = resources.filter(res => res.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <PageContainer>
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">Institutional Hardware Catalog</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-textMain mt-2">Browse Available Equipment</h1>
        <p className="text-sm sm:text-base text-textMain/80 mt-2">Find the right tools and spaces for your next project.</p>
      </div>
      
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="relative">
          <Search className="w-4 h-4 text-textMain/80 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by equipment name, lab, or room location..." 
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-secondary text-sm text-textMain placeholder:text-textMain/80 focus:bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-200" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
        {filtered.map(res => <EquipmentCard key={res.id} res={res} />)}
        {loading && (
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-surface px-6 py-12 text-center text-sm text-textMain/75 shadow-sm">Loading equipment…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-surface px-6 py-12 text-center shadow-sm">
            <p className="font-bold text-textMain">No equipment found</p>
            <p className="text-sm text-textMain/80 mt-1">Try searching with a different name or location.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}