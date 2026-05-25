# בדיקה של התרעה - הוראות עבור בדיקה מעשית

## בעיה שתוקנה
ההתרעה לא הופיעה כי:
1. `alertDismissedUntil` היה מאותחל ל-0 (קודם) - כעת מאותחל ל-(-1)
2. `activeTabStartTime` לא היה מאותחל כשהservice worker התחיל
3. לא היה logging מספיק כדי לראות איפה הבעיה

## כיצד לבדוק את התרעה

### שלב 1: טעינת התוסף
1. לך ל-`chrome://extensions/`
2. הפעל "Developer mode" (פינה עליונה ימנית)
3. לחץ "Load unpacked"
4. בחר את התיקייה `mine-exte`
5. התוסף יופיע ברשימה

### שלב 2: הורדת הגבל היומי לערך קטן לטסטינג
1. לחץ על אייקון התוסף
2. לחץ על ⚙️ הגדרות
3. שנה "הגבלת השימוש היומית" ל-**1 דקה** (00:01)
4. שמור הגדרות

### שלב 3: המתנה וניטור
1. פתח את DevTools בדפדפן (F12)
2. לך ל-Console
3. פתוח את הדף הנוכחי (כל דף)
4. חכה כ-**1 דקה** כדי שהוסף יעקוב אחרי זמן הדף
5. עבור לדף אחר (לחץ על tab חדש או דף אחר)
6. בדוק את ה-Console - אתה צריך לראות:

```
[Time Tracker] ALERT TRIGGERED! Total: XXXXX ms exceeds limit: 60000 ms
[Time Tracker] Limit exceeded - showing alert window
[Time Tracker] Offscreen document created successfully
```

### שלב 4: בדוק את הלוגים
ב-Console, חפש אחרי:

**צפוי לראות:**
- `[Time Tracker] Background service worker started at ...`
- `[Time Tracker] Tab activated: XXX`
- `[Time Tracker] Saving domain time. Domain: ...`
- `[Time Tracker] Total time now: XXXXX ms | Limit: 60000 ms`
- `[Time Tracker] ALERT TRIGGERED!`

**אם לא רואה את זה:**
- בדוק את הconsole של background worker (אייקון הרחבה → פרטים → Service Worker)
- וודא שה-tab הנוכחי זורז את הדף (לא about:blank או מיני-טאב)

### שלב 5: בדוק את חלון ההתרעה
כשההתרעה מופעלת, חלון חדש צריך להופיע עם:
- 🔴 ⏰ הגבלה היומית חרוגה!
- הודעה בעברית
- שימוש היום (בדקות)
- כפתורים: "התעלם" ו"הזכר לי"

## בדיקה מתקדמת

### לחזור הגבלה לנורמל
1. לחץ ⚙️ הגדרות
2. חזור ל-2 שעות (02:00)
3. לחץ "אפס היום" בpopup כדי לנקות את הנתונים

### בדיקה של fallback notification
אם חלון ההתרעה לא פתוח:
- היא צריכה להציג notification בـ Chrome (פינה תחתונה ימנית)
- כולל הודעה "חרגת מהגבלת השימוש היומית שלך"

### ניטור ב-Chrome DevTools
1. פתח `chrome://extensions/`
2. מצא את Time Tracker
3. לחץ על "Service Worker" כדי לפתוח את ה-DevTools שלו
4. ראה את כל ה-console messages

## תיקונים שבוצעו

| בעיה | תיקון |
|------|-------|
| alertDismissedUntil לא מאותחל | ערך ברירת מחדל -1 (תמיד תן אפשרות להתרעה) |
| activeTabStartTime לא מאותחל | אתחול ב-onInstalled ו-onStartup |
| הצעות מעטות | הוספת 20+ console.log בנקודות קריטיות |
| offscreen.createDocument שגיאה | בדיקה עם hasDocument() וטיפול בשגיאות |
| תגובה איטית ב-alert-window.js | אין שינוי (זה תקין) |

## שאלות שכיחות

**Q: למה זה לוקח דקה?**
A: התוסף שומר זמן רק כשמחליפים טאבים. זה בכוונה (חיסכון משאבים).

**Q: למה אין notification צעיף?**
A: Notifications מופיעות בתחתית הדף. חפש בxxxxxxxxxונה ימנית.

**Q: האם זה עובד עם אתרים רבים?**
A: כן! הוסף כמה דפים ונוודא שהזמן צבור על פני כל הטאבים.

**Q: מה אם ההתרעה לא מופיעה בעדיין?**
1. בדוק את Service Worker DevTools
2. וודא שה-tab זורז (לא about:blank)
3. וודא שהגבל הוא < זמן המתנה שלך
4. לחץ "אפס היום" ונסה שנית

