import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ReportData } from './types';

interface ContactInfoFormProps {
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
}

const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ reportData, setReportData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setReportData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
      <CardContent className="space-y-6 mt-5">
        <div>
          <h3 className="text-white font-bold mb-2 text-xl">对接人员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactName" className="text-white">姓名</Label>
              <Input
                id="contactName"
                value={reportData.contactName}
                onChange={handleChange}
                placeholder="例如：张三"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone" className="text-white">联系电话</Label>
              <Input
                id="contactPhone"
                value={reportData.contactPhone}
                onChange={handleChange}
                placeholder="例如：1234567890"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
        <Separator className="bg-slate-600" />
        <div>
          <h3 className="text-white font-bold mb-2 text-xl">测试人员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testerName" className="text-white">姓名</Label>  
              <Input
                id="testerName"
                value={reportData.testerName}
                onChange={handleChange}
                placeholder="例如：李四"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="testerPhone" className="text-white">联系电话</Label>
              <Input
                id="testerPhone"
                value={reportData.testerPhone}
                onChange={handleChange}
                placeholder="例如：1234567890"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInfoForm;
