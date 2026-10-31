import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { MapPin, ArrowRight } from 'lucide-react';
import { getEquipmentCategoryLabel } from '../../config/equipmentCategories';

export default function EquipmentCard({ res }) {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/equipment/${res.id}`)} className="content-enter group cursor-pointer bg-surface rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-accent/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="h-52 sm:h-60 w-full bg-secondary relative overflow-hidden shrink-0">
        <img src={res.image} alt={res.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent pointer-events-none" />
        
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-textMain border border-white/50 text-xs font-bold shadow-sm">
            {getEquipmentCategoryLabel(res.categoryId || res.category)}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <StatusBadge status={res.status} />
        </div>
        
        <div className="absolute bottom-3.5 left-4 right-4 flex items-center text-white">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            {res.location}
          </span>
        </div>
      </div>
      
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-textMain group-hover:text-accent transition-colors leading-tight">{res.name}</h3>
          <p className="text-sm text-textMain/80">Managed by {res.ownerName} • {res.department}</p>
        </div>
        <button className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-accent text-textMain hover:text-white text-sm font-bold transition-colors mt-auto">
          View Details & Request Access <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}