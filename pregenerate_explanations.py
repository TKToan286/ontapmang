import json
import urllib.request
import urllib.error
import concurrent.futures
import time
import os
import sys

# API Configuration
API_KEY = "sk-NtyQXerBlZhF4Tw8mHlbS6Cy2ODBMoFridMj0Ngqr6KMetOx"
BASE_URL = "https://api.gaugauai.com/v1/chat/completions"
MODEL = "gpt-5.5"

# File Paths
JSON_PATH = os.path.join("network-quiz-ui", "src", "data", "questions.json")

def generate_explanation(question, retries=5):
    q_id = question.get("id")
    content = question.get("content", "")
    options = question.get("options", [])
    correct_answer = question.get("correct_answer", "")
    
    # Format options string
    options_text = ""
    for opt in options:
        options_text += f"- {opt.get('label')}: {opt.get('text')}\n"
        
    prompt = (
        "Bạn là chuyên gia mạng máy tính hàng đầu. Hãy viết lời giải thích ngắn gọn, súc tích và chính xác (khoảng 3-5 câu) cho câu hỏi trắc nghiệm mạng máy tính dưới đây. Hãy nêu rõ tại sao phương án đúng là đáp án đúng, và giải thích sơ lược lỗi sai của các phương án khác nếu cần thiết.\n\n"
        f"Câu hỏi: {content}\n"
        f"Các lựa chọn:\n{options_text}"
        f"Đáp án đúng là: {correct_answer}\n\n"
        "Hãy viết phần giải thích bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề, không dài dòng giải thích dông dài."
    )
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    data = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5
    }
    
    json_data = json.dumps(data).encode("utf-8")
    
    delay = 2
    for attempt in range(retries):
        try:
            req = urllib.request.Request(BASE_URL, data=json_data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                explanation = res_json["choices"][0]["message"]["content"].strip()
                return q_id, explanation
        except urllib.error.HTTPError as he:
            if he.code == 429:
                # 429 Rate limit - back off heavily
                wait_time = delay * 3 + 2
                print(f"[RateLimit] Question {q_id} hit 429. Backing off for {wait_time}s...")
                time.sleep(wait_time)
                delay *= 2
            else:
                print(f"[HTTP Error] Question {q_id} failed with code {he.code}: {he.reason}")
                time.sleep(delay)
                delay *= 2
        except Exception as e:
            print(f"[Error] Question {q_id} failed attempt {attempt + 1}: {str(e)[:100]}")
            time.sleep(delay)
            delay *= 2
            
    print(f"[Failure] Failed to generate explanation for Question {q_id} after {retries} retries.")
    return q_id, None

def main():
    if not os.path.exists(JSON_PATH):
        print(f"[Error] Question file not found at: {JSON_PATH}")
        sys.exit(1)
        
    print(f"Reading questions from {JSON_PATH}...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        questions = json.load(f)
        
    total_questions = len(questions)
    print(f"Total questions count: {total_questions}")
    
    # Filter questions that need explanation
    questions_to_process = [q for q in questions if not q.get("explanation")]
    to_process_count = len(questions_to_process)
    
    print(f"Questions needing explanations: {to_process_count}")
    if to_process_count == 0:
        print("All questions already have explanations!")
        return
        
    print("Starting parallel generation of explanations (3 worker threads)...")
    
    results = {}
    completed = 0
    start_time = time.time()
    
    # Use 3 concurrent workers to stay well under rate limits
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_to_q = {executor.submit(generate_explanation, q): q for q in questions_to_process}
        
        for future in concurrent.futures.as_completed(future_to_q):
            q_id, explanation = future.result()
            completed += 1
            if explanation:
                results[q_id] = explanation
                print(f"[{completed}/{to_process_count}] Generated explanation for question ID {q_id}")
            else:
                print(f"[{completed}/{to_process_count}] [SKIP] Failed for question ID {q_id}")
                
            # Periodically save progress every 10 questions
            if completed % 10 == 0:
                print("--- Saving intermediate progress... ---")
                save_progress(questions, results)
                # Small throttle to prevent hitting limits
                time.sleep(0.5)
                
    # Final save
    save_progress(questions, results)
    elapsed = time.time() - start_time
    print(f"\nDone! Execution time: {elapsed:.2f} seconds.")
    print(f"Successfully generated explanations for {len(results)}/{to_process_count} questions.")

def save_progress(questions, results):
    # Update questions in memory
    for q in questions:
        q_id = q.get("id")
        if q_id in results:
            q["explanation"] = results[q_id]
            
    # Write to a temporary file first for atomic write
    temp_path = JSON_PATH + ".tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        # Rename temp file to target path
        if os.path.exists(JSON_PATH):
            os.remove(JSON_PATH)
        os.rename(temp_path, JSON_PATH)
        print("[SUCCESS] Wrote progress to questions.json.")
    except Exception as e:
        print(f"[Error] Failed to save progress: {e}")

if __name__ == "__main__":
    main()
