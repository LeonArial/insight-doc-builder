import React from 'react';
import { ClipboardPlus } from 'lucide-react';

const ReportHeader = () => (
  <div className="text-center mb-8">
    <div className="flex items-center justify-center mb-4">
      <ClipboardPlus className="w-12 h-12 text-blue-400 mr-3" />
      <h1 className="text-4xl font-bold text-white">渗透测试报告生成器</h1>
    </div>
    <p className="text-blue-200 text-lg">基于云汉数科渗透测试报告模板的报告生成工具</p>
  </div>
);

export default ReportHeader;
