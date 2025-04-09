import { toast } from "sonner";

// Removed unused type definition
// interface BackendConvertResponse {
//   markdown: string;
// }

// Define the structure we will return to the calling component
// Include original file name for context
export interface ConversionResult {
  name: string; // Original filename
  markdown: string;
}

export const convertToMarkdown = async (
  file: File // Accept a single file
): Promise<ConversionResult | null> => {
  // Removed accountId and apiToken checks
  
  console.log(`开始处理文件: ${file.name}...`);

  const formData = new FormData();
  // Use the field name 'file' as expected by the backend
  formData.append('file', file); 
  console.log(`添加文件: ${file.name}, 类型: ${file.type}, 大小: ${file.size} 字节`);

  // Our backend API endpoint
  const url = '/api/convert'; 
  console.log(`API URL: ${url}`);

  // Use AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  try {
    console.log("发送后端 API 请求...");

    const response = await fetch(url, {
      method: "POST",
      // No Authorization header needed here
      // No mode or credentials needed for same-origin request via proxy
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout

    if (!response) {
      throw new Error("网络请求失败 - 没有收到响应");
    }

    console.log(`后端 API 响应状态: ${response.status} ${response.statusText}`);

    try {
      const data = await response.json();
      console.log("后端 API 响应数据:", data);

      if (!response.ok) {
        // Use error message from backend response if available
        const errorMsg = `后端 API 错误: ${response.status} ${response.statusText}${data.error ? `\n消息: ${data.error}` : ''}`;
        toast.error(errorMsg);
        console.error("后端 API 错误详情:", data);
        return null;
      }
      
      // Check if the expected markdown field exists
      if (typeof data.markdown !== 'string') {
          toast.error("后端 API 错误: 响应中未找到有效的 Markdown 数据。");
          console.error("无效的后端响应:", data);
          return null;
      }

      console.log(`成功转换文件: ${file.name}`);
      // Return the result in the new format
      return { name: file.name, markdown: data.markdown };

    } catch (error) {
      console.error("后端 API 响应解析过程中发生错误:", error);
      let errorMessage = "后端 API 响应解析过程中发生意外错误。";
      if (error instanceof Error) {
        errorMessage += ` 错误信息: ${error.message}`;
      }
      toast.error(errorMessage);
      return null;
    }
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared
    console.error("后端 API 调用过程中发生错误:", error);
    let errorMessage = "调用后端 API 时发生意外错误。";
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "API 请求超时，请检查网络连接或稍后重试。";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "无法连接到后端 API 服务器，请确认服务已运行。";
      } else {
        errorMessage += ` 错误信息: ${error.message}`;
      }
    }
    toast.error(errorMessage);
    return null;
  }
}; 