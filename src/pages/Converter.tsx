import { useState, DragEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, File, Loader2, UploadCloud, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import API_CONFIG from '@/config';

const Converter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File | null) => {
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setIsConverted(false);
        toast.success(`已选择文件: ${file.name}`);
      } else {
        toast.error('请上传有效的 .xls 或 .xlsx 文件。');
        setSelectedFile(null);
        setIsConverted(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] || null);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setIsConverted(false);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.warning('请先选择一个文件。');
      return;
    }

    setIsConverting(true);
    toast.info('开始转换，请稍候...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_CONFIG.dailyURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok && response.url.includes('/generated/')) {
        toast.success('转换成功！文件将自动下载。');
        
        // 创建一个隐藏的链接来触发下载，避免页面跳转
        const link = document.createElement('a');
        link.href = response.url;
        link.download = selectedFile.name.replace(/\.(xlsx?|xls)$/i, '.html');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsConverted(true);
      } else {
        throw new Error('转换失败，请检查文件或联系管理员。');
      }

    } catch (err: any) {
      toast.error(err.message || '发生未知错误。');
      setIsConverted(false);
    } finally {
      setIsConverting(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0] || null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl w-full">
        <Card
          className={cn(
            'transition-all duration-300 shadow-lg hover:shadow-xl',
            isDragging && 'border-primary border-2 border-dashed bg-primary/5 scale-[1.02]',
            isConverted && 'border-green-500 bg-green-50/50'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isConverted ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
              <span>日报生成器</span>
            </CardTitle>
            <CardDescription>
              {isConverted ? (
                <span className="text-green-600 font-medium">转换完成！您可以继续上传新文件。</span>
              ) : (
                '拖放或选择您的 .xlsx 文件，我会将其转换为可在线预览的 HTML 文件。'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <label
              htmlFor="file-upload"
              className={cn(
                'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300',
                isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-muted-foreground/25',
                !isDragging && 'hover:border-primary/50 hover:bg-muted/30',
                isConverted && 'border-green-300 bg-green-50/30'
              )}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isConverted ? (
                  <CheckCircle className="w-10 h-10 mb-3 text-green-500" />
                ) : (
                  <UploadCloud className={cn(
                    'w-10 h-10 mb-3 transition-colors',
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  )} />
                )}
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">
                    {isConverted ? '上传新文件' : '点击上传'}
                  </span> 或拖放文件
                </p>
                <p className="text-xs text-muted-foreground">支持 .xlsx 和 .xls 格式</p>
              </div>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <File className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">已选择: {selectedFile.name}</span>
                  {isConverted && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFileInput}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-4">
              {isConverted && (
                <Button
                  variant="outline"
                  onClick={resetFileInput}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新开始
                </Button>
              )}
              <Button 
                onClick={handleConvert} 
                disabled={!selectedFile || isConverting}
                className={cn(
                  'min-w-[120px] transition-all duration-300',
                  isConverted && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    转换中...
                  </>
                ) : isConverted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    转换完成
                  </>
                ) : (
                  '开始转换'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8 w-full">
          <CardHeader>
            <CardTitle className="text-xl">如何将HTML另存为PDF？</CardTitle>
            <CardDescription>
              下载HTML文件后，在浏览器中打开它，然后按下 Ctrl+P (或 Cmd+P) 选择“另存为PDF”。
              <br />
              根据图示中红框部分进行设置，可以让样式保持与html统一。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <img src="/tips.png" className="rounded-lg border w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Converter;
