import React from 'react';
import { List, UserCheck, GraduationCap, Calendar } from 'lucide-react';

// Interface ini sangat penting agar TypeScript mengenali props yang dikirim
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  textColor: string;
}

const StatCard = ({ title, value, icon, color, textColor }: StatCardProps) => {
  const renderIcon = () => {
    switch (icon) {
      case 'list': return <List size={20} />;
      case 'user-check': return <UserCheck size={20} />;
      case 'school': return <GraduationCap size={20} />;
      case 'calendar': return <Calendar size={20} />;
      default: return <List size={20} />;
    }
  };

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color} ${textColor}`}>
        {renderIcon()}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-gray-800">{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default StatCard;