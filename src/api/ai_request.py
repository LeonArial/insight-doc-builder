import requests

def generate_text_from_ai(vuln_name, prompt_type, api_url, api_key):
    """
    Generates text from the AI API based on vulnerability name and prompt type.
    """
    if prompt_type == 'description':
        prompt_content = f"你现在要写一份渗透测试报告,根据我输入的漏洞名称,写出漏洞的风险描述,字数在100字左右:{vuln_name}"
    elif prompt_type == 'advice':
        prompt_content = f"你现在要写一份渗透测试报告,根据我输入的漏洞名称,写出该漏洞的整改建议,字数在100字左右:{vuln_name}"
    else:
        raise ValueError("Invalid prompt type")

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
                "content": prompt_content
            }
        ]
    }
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }

    response = requests.post(api_url, json=payload, headers=headers)
    response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)

    ai_response = response.json()
    try:
        content = ai_response['choices'][0]['message']['content'].strip()
        return content
    except (KeyError, IndexError):
        # Re-raise a more specific error to be caught by the caller
        raise ValueError(f"Failed to parse AI response: {response.text}")