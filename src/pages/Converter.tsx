import { useState, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, File, Download, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Converter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File | null) => {
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setDownloadUrl(null);
        toast.success(`已选择文件: ${file.name}`);
      } else {
        toast.error('请上传有效的 .xlsx 文件。');
        setSelectedFile(null);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] || null);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.warning('请先选择一个文件。');
      return;
    }

    setIsConverting(true);
    setDownloadUrl(null);
    toast.info('开始转换，请稍候...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // TODO: 替换为真实的后端 API 地址
      const response = await fetch('/api/excel-to-html', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('转换失败，请检查文件或联系管理员。');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      toast.success('转换成功！文件已可供下载。');

    } catch (err: any) {
      toast.error(err.message || '发生未知错误。');
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
    <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl w-full">
        <Card
          className={cn('transition-all', isDragging && 'border-primary border-2 border-dashed bg-muted/50')}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Upload className="w-6 h-6" />
              <span>日报生成器</span>
            </CardTitle>
            <CardDescription>
              拖放或选择您的 .xlsx 文件，我会将其转换为可在线预览的 HTML 文件。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">点击上传</span> 或拖放文件
                </p>
                <p className="text-xs text-muted-foreground">仅支持 .xlsx 格式</p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t mt-4 pt-4">
                <File className="w-4 h-4" />
                <span>已选择: {selectedFile.name}</span>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button onClick={handleConvert} disabled={!selectedFile || isConverting}>
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    转换中...
                  </>
                ) : (
                  '开始转换'
                )}
              </Button>
              {downloadUrl && (
                <Button asChild>
                  <a href={downloadUrl} download={`${selectedFile?.name.replace(/\.xlsx$/, '') || 'document'}.html`}>
                    <Download className="mr-2 h-4 w-4" />
                    下载 HTML
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Converter;
