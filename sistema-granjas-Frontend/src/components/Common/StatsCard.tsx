import React from "react";

export interface StatsCardProps {
    icon: string;
    color: string;
    value: number | string;
    label: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ icon, color, value, label }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-gray-100">
            <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <i className={`${icon} text-white text-2xl`}></i>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
            <p className="text-gray-600 font-medium">{label}</p>
        </div>
    );
};

export default StatsCard;