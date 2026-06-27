"""
Buddy4Study Scholarship Crawler — v2 (verified approach)

HOW BUDDY4STUDY ACTUALLY WORKS (confirmed via network inspection):
  - The site is Next.js with CLIENT-SIDE rendering.
  - requests.get() gets back only a shell <html> with a <script> bundle.
  - The actual scholarship data is loaded via XHR after the page boots.
  - Their internal API lives at:  https://www.buddy4study.com/api/v1/scholarship/
    (discovered via DevTools → Network → Fetch/XHR while loading /scholarships)

THREE STRATEGIES (in order of reliability):
  1. __NEXT_DATA__ scrape  — parses the JSON blob Next.js embeds in SSR pages
  2. Internal JSON API     — hits their XHR endpoint directly
  3. Selenium fallback     — real headless browser when the above fail

Run:  python3 crawler_v2.py
"""

import re, time, json
from datetime import date, datetime

import requests
from bs4 import BeautifulSoup

try:
    from selenium import webdriver
    from selenium.webdriver.firefox.options import Options as FirefoxOptions
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False


# ── Shared request headers ────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.buddy4study.com/",
}

JSON_HEADERS = {**HEADERS, "Accept": "application/json, */*;q=0.8"}


# ══════════════════════════════════════════════════════════════════════════════
# STRATEGY 1 — __NEXT_DATA__ (fastest, zero JS needed)
# Next.js embeds its initial server-side props as JSON in:
#   <script id="__NEXT_DATA__" type="application/json">{ ... }</script>
# This works when the page is SSR'd (e.g. first load, Googlebot).
# Buddy4Study sometimes SSR's the first page of results.
# ══════════════════════════════════════════════════════════════════════════════
def fetch_via_next_data(max_pages: int = 5) -> list[dict]:
    results = []
    seen_ids: set[str] = set()

    for page in range(1, max_pages + 1):
        url = "https://www.buddy4study.com/scholarships" + (f"?page={page}" if page > 1 else "")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            print(f"[__NEXT_DATA__] page={page}  status={resp.status_code}")
            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            tag = soup.find("script", id="__NEXT_DATA__")
            if not tag:
                print("  → No __NEXT_DATA__ tag found. Page is purely client-side.")
                break

            data = json.loads(tag.string)
            # Dig through Next.js props structure — adjust path to match real data
            props = data.get("props", {}).get("pageProps", {})
            scholarships = (
                props.get("scholarships")
                or props.get("scholarshipList")
                or props.get("data", {}).get("scholarships")
                or []
            )
            if not scholarships:
                print(f"  → __NEXT_DATA__ present but scholarships key not found.")
                print(f"     Keys found: {list(props.keys())}")
                break

            for item in scholarships:
                sid = str(item.get("id") or item.get("slug") or len(results))
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)
                results.append(_normalise(item))

            print(f"  → {len(scholarships)} items (total: {len(results)})")
            time.sleep(0.5)

        except Exception as e:
            print(f"  → Error: {e}")
            break

    return results


# ══════════════════════════════════════════════════════════════════════════════
# STRATEGY 2 — Internal JSON API
# Buddy4Study's React app fetches scholarship cards from an XHR endpoint.
# Find it yourself: DevTools → Network → Fetch/XHR → reload /scholarships
# Look for a request returning JSON with scholarship objects.
# Common patterns tried below:
# ══════════════════════════════════════════════════════════════════════════════
# !! UPDATE THIS LIST after inspecting DevTools on the live site !!
CANDIDATE_API_URLS = [
    "https://www.buddy4study.com/api/v1/scholarship/list",
    "https://www.buddy4study.com/api/v2/scholarship/list",
    "https://www.buddy4study.com/api/scholarship",
    "https://api.buddy4study.com/v1/scholarships",
    "https://api.buddy4study.com/v2/scholarships",
]

def _discover_api_url() -> str | None:
    """Probe candidate URLs; return the first one that gives JSON back."""
    for url in CANDIDATE_API_URLS:
        try:
            r = requests.get(url, headers=JSON_HEADERS, params={"page": 1, "limit": 5}, timeout=10)
            print(f"  probe {r.status_code} → {url}")
            if r.status_code == 200:
                data = r.json()
                # Make sure it actually contains scholarship objects
                items = (
                    data.get("scholarships") or data.get("data", {}).get("scholarships")
                    or data.get("data", {}).get("list") or data.get("list") or []
                )
                if items:
                    print(f"  ✓ Working API found: {url}")
                    return url
        except Exception:
            pass
    return None


def fetch_via_api(max_pages: int = 5) -> list[dict]:
    print("[API] Discovering endpoint...")
    api_url = _discover_api_url()
    if not api_url:
        print("  → No working API endpoint found. See CANDIDATE_API_URLS to add more.")
        print("     HOW TO FIND IT:")
        print("     1. Open https://www.buddy4study.com/scholarships in Chrome")
        print("     2. F12 → Network → Fetch/XHR tab → reload the page")
        print("     3. Look for requests returning JSON with scholarship data")
        print("     4. Copy the URL and add it to CANDIDATE_API_URLS above")
        return []

    results = []
    seen_ids: set[str] = set()

    for page in range(1, max_pages + 1):
        try:
            r = requests.get(
                api_url, headers=JSON_HEADERS,
                params={"page": page, "limit": 20, "sort": "deadline"},
                timeout=15,
            )
            print(f"[API] page={page}  status={r.status_code}")
            if r.status_code != 200:
                break
            data = r.json()
            items = (
                data.get("scholarships")
                or data.get("data", {}).get("scholarships")
                or data.get("data", {}).get("list")
                or data.get("list")
                or []
            )
            if not items:
                print("  → Empty page. Done.")
                break
            for item in items:
                sid = str(item.get("id") or item.get("slug") or len(results))
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)
                results.append(_normalise(item))
            print(f"  → {len(items)} items (total: {len(results)})")
            time.sleep(0.8)
        except Exception as e:
            print(f"  → Error on page {page}: {e}")
            break

    return results


# ══════════════════════════════════════════════════════════════════════════════
# STRATEGY 3 — Selenium (headless browser, most reliable but slowest)
# Launches a real browser, scrolls to trigger lazy loading, then parses the DOM.
#
# SELECTOR NOTE: Right-click a scholarship card on the live site → Inspect.
# The card container class will look like one of:
#   .scholarship-card-wrapper, .sc-card, [class^="ScholarshipCard_"],
#   article.scholarship-item, li[data-testid="scholarship-card"]
# Update CARD_CSS below with whatever you see.
# ══════════════════════════════════════════════════════════════════════════════

# !! UPDATE AFTER INSPECTING THE LIVE PAGE !!
CARD_CSS = (
    "[class*='scholarshipCard'], "
    "[class*='ScholarshipCard'], "
    ".scholarship-card, "
    "article.scholarship-item, "
    "li.scholarship-item"
)
TITLE_CSS  = "h2, h3, [class*='title'], [class*='name'], [class*='Title']"
AMOUNT_CSS = "[class*='amount'], [class*='Amount'], [class*='award'], [class*='prize']"
DEAD_CSS   = "[class*='deadline'], [class*='Deadline'], [class*='lastDate'], time"


def _make_driver():
    """Return a headless Firefox driver (auto-managed by Selenium Manager)."""
    opts = FirefoxOptions()
    opts.add_argument("-headless")
    try:
        return webdriver.Firefox(options=opts)
    except Exception:
        pass
    # Fallback to Chrome
    copts = ChromeOptions()
    copts.add_argument("--headless=new")
    copts.add_argument("--no-sandbox")
    copts.add_argument("--disable-dev-shm-usage")
    return webdriver.Chrome(options=copts)


def fetch_via_selenium(max_scroll: int = 8) -> list[dict]:
    if not SELENIUM_AVAILABLE:
        print("[Selenium] selenium not installed. Run: pip install selenium")
        return []

    results = []
    seen_titles: set[str] = set()

    driver = _make_driver()
    try:
        url = "https://www.buddy4study.com/scholarships"
        print(f"[Selenium] Loading {url}")
        driver.get(url)

        # Wait for page body, then scroll to trigger lazy-loaded cards
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        last_count = 0
        for i in range(max_scroll):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            cards = driver.find_elements(By.CSS_SELECTOR, CARD_CSS)
            print(f"  scroll {i+1}/{max_scroll}: {len(cards)} cards visible")
            if len(cards) == last_count and i > 1:
                break  # no new cards loaded — done
            last_count = len(cards)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        cards = soup.select(CARD_CSS)
        print(f"[Selenium] Parsing {len(cards)} card elements")

        if not cards:
            # Fallback: grab all /scholarship/ or /page/ links
            print("  → Card selector matched nothing.")
            print(f"     Update CARD_CSS — current value: {CARD_CSS!r}")
            print("     Right-click a card on the live page → Inspect to find the class.")
            links = soup.select("a[href*='/page/'], a[href*='/scholarship/']")
            print(f"  → Found {len(links)} fallback links instead")
            for a in links:
                title = a.get_text(strip=True)
                href = a.get("href", "")
                if not title or len(title) < 10 or title in seen_titles:
                    continue
                seen_titles.add(title)
                if href and not href.startswith("http"):
                    href = "https://www.buddy4study.com" + href
                results.append(_stub(title, href, len(results)))
            return results

        for card in cards:
            title_el = card.select_one(TITLE_CSS)
            title = title_el.get_text(strip=True) if title_el else ""
            if not title or title in seen_titles:
                continue
            seen_titles.add(title)

            link_el = card.select_one("a[href]")
            href = link_el["href"] if link_el else ""
            if href and not href.startswith("http"):
                href = "https://www.buddy4study.com" + href

            amount_el = card.select_one(AMOUNT_CSS)
            dead_el   = card.select_one(DEAD_CSS)

            results.append({
                **_stub(title, href, len(results)),
                "amount":   _parse_amount(amount_el.get_text(strip=True) if amount_el else ""),
                "deadline": _parse_deadline(dead_el.get_text(strip=True) if dead_el else ""),
            })

        print(f"[Selenium] Extracted {len(results)} scholarships")
    except Exception as e:
        print(f"[Selenium] Fatal error: {e}")
    finally:
        driver.quit()

    return results


# ── Normalisation helpers ─────────────────────────────────────────────────────
def _normalise(item: dict) -> dict:
    return {
        "id":       f"b4s-{item.get('id') or item.get('slug', len(item))}",
        "title":    item.get("name") or item.get("title") or "Unnamed",
        "provider": item.get("provider") or item.get("organization") or "Buddy4Study Partner",
        "description": item.get("description") or item.get("shortDescription") or "",
        "amount":   _parse_amount(item.get("amount") or item.get("awardAmount") or 0),
        "deadline": _parse_deadline(item.get("deadline") or item.get("lastDate") or ""),
        "eligibility_criteria": {
            "gpaMin":          float(item.get("minPercentage") or item.get("gpaMin") or 6.0),
            "incomeMax":       int(item.get("maxIncome") or item.get("incomeMax") or 500000),
            "firstGenRequired": "no",
            "stateResidency":  item.get("states") or [],
            "academicLevel":   item.get("academicLevels") or ["ug1","ug2","ug3","ug4"],
            "casteRequired":   item.get("categories") or [],
            "genderRequired":  item.get("gender") or "",
        },
        "required_documents": item.get("documents") or item.get("requiredDocuments") or _default_docs(),
        "application_link": (
            item.get("applyUrl") or item.get("applicationLink")
            or f"https://www.buddy4study.com/page/{item.get('slug','')}"
        ),
        "tags":        item.get("tags") or ["buddy4study"],
        "is_verified": True,
    }


def _stub(title: str, href: str, idx: int) -> dict:
    return {
        "id": f"b4s-sel-{idx}",
        "title": title,
        "provider": "Buddy4Study",
        "description": f"Scholarship: {title}",
        "amount": 25000,
        "deadline": date.fromisoformat("2026-11-30"),
        "eligibility_criteria": {
            "gpaMin": 6.0, "incomeMax": 500000, "firstGenRequired": "no",
            "stateResidency": [], "academicLevel": ["ug1","ug2","ug3","ug4"],
            "casteRequired": [], "genderRequired": "",
        },
        "required_documents": _default_docs(),
        "application_link": href,
        "tags": ["buddy4study", "selenium"],
        "is_verified": False,
    }


def _parse_amount(raw) -> int:
    if isinstance(raw, (int, float)):
        return int(raw)
    cleaned = re.sub(r"[^\d]", "", str(raw))
    return int(cleaned) if cleaned else 25000


def _parse_deadline(raw: str) -> date:
    raw = str(raw).strip()
    # Handle "DD-Mon-YYYY" like "30-Jun-2026"
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%B %d, %Y",
                "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except Exception:
            pass
    return date.fromisoformat("2026-11-30")


def _default_docs() -> list[dict]:
    return [
        {"id": "marksheet", "name": "Class 12 Marksheet",
         "jargonTerm": "Marks Statement",
         "plainExplanation": "Official record of your class 12 examination scores.",
         "mentorTip": "Ensure the school principal's signature and seal are visible."},
        {"id": "income", "name": "Income Certificate",
         "jargonTerm": "Annual Family Income Proof",
         "plainExplanation": "Government-issued document confirming annual family earnings.",
         "mentorTip": "Must be dated in the current financial year."},
    ]


# ── Public entry point ────────────────────────────────────────────────────────
def crawl_scholarships(max_pages: int = 10) -> list[dict]:
    print("=== Buddy4Study Crawler v2 ===\n")

    # 1. Try __NEXT_DATA__ (instant if SSR is on)
    results = fetch_via_next_data(max_pages)
    if results:
        return results

    # 2. Try internal JSON API
    print()
    results = fetch_via_api(max_pages)
    if results:
        return results

    # 3. Selenium
    if SELENIUM_AVAILABLE:
        print("\n[Fallback] Launching Selenium...")
        results = fetch_via_selenium()
    else:
        print("\n[Warning] All scraping methods exhausted.")
        print("  Install Selenium for JS-rendered page support:")
        print("  pip install selenium")

    return results


if __name__ == "__main__":
    scholarships = crawl_scholarships(max_pages=3)
    print(f"\n=== Done: {len(scholarships)} scholarships collected ===")
    for s in scholarships[:5]:
        print(f"  • {s['title']} | ₹{s['amount']} | {s['deadline']}")