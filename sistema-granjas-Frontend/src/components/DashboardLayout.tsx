import React from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="mt-20 px-6 lg:px-12">
            {children}
        </div>
    );
};

export default DashboardLayout;
