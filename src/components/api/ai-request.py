import requests

url = "https://api.siliconflow.cn/v1/chat/completions"

payload = {
    "model": "Qwen/Qwen3-8B",
    "stream": False,
    "max_tokens": 512,
    "enable_thinking": False,
    "thinking_budget": 4096,
    "min_p": 0.05,
    "temperature": 0.7,
    "top_p": 0.7,
    "top_k": 50,
    "frequency_penalty": 0.5,
    "n": 1,
    "stop": [],
    "messages": [
        {
            "role": "user",
            "content": "你现在要写一份渗透测试报告,根据我输入的漏洞名称,写出漏洞的风险描述,字数在100字左右:sql注入"
        }
    ]
}
headers = {
    "Authorization": "Bearer sk-dmowsenrtifmlnpmlhaatxgkxnhbmusjfzgnofvlhtblslwa",
    "Content-Type": "application/json"
}

response = requests.request("POST", url, json=payload, headers=headers)

print(response.text)