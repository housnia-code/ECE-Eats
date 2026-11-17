# ECE-Eats# 
ECE Eats — Student Flow

Campus food pre-ordering for students (menu, tray, checkout, orders).
This is a standalone student-flow starter built with plain HTML, CSS and JavaScript.

## Files

```
index.html        Welcome page (links to the menu and to registration)
register.html     Student registration form (saved in localStorage)
menu.html         Menu page with the tray beside it
checkout.html     Checkout: pickup time, payment, card pop-up, confirmation pop-up
myorders.html     Current order with progress + previous orders
css/student.css   All styles (desktop, tablet and mobile)
js/student.js     All logic, shared by every page
```

## How to use

1. Copy the five `.html` files into the repository root (or adjust the paths if your team uses another folder).
2. Copy `css/student.css` into the existing `css/` folder.
3. Copy `js/student.js` into the existing `js/` folder.
4. Open `index.html` with VS Code Live Server.

## How the student flow works

1. **register.html** (optional): the student enters name, email, phone and program. They appear in step 3 of the checkout.
2. **menu.html**: filter by category, search, and add food to the tray. The `+` / `−` steppers and the total update automatically.
3. **checkout.html**: choose a pickup time and a payment method, then confirm. A card pop-up appears for card payment, then an order confirmation pop-up.
4. **myorders.html**: shows the current order with its progress, and the previous orders.

## Data (localStorage keys)

| Key | Content |
| --- | --- |
| `eceEatsStudentCart` | The tray |
| `eceEatsStudentOrders` | All orders, newest first |
| `eceEatsStudentProfile` | The registered student |

## Notes

- The interface uses sample menu data (in `js/student.js`) and browser localStorage. There is no server.
- Payment is simulated. Do NOT enter real card details; no real payment provider is connected.
- Food images are loaded from Unsplash URLs, with `images/dishes.png` as a fallback.
- The order status starts as `Confirmed`. The progress bar shows four stages (Confirmed, Cooking, Ready, Collected), but status updates from the restaurant staff are not connected yet. For a demo, change an order's `status` in the browser's localStorage, or extend the staff integration. An order only appears under "Previous orders" once its status is `Collected`.
- Before merging, compare with the repository's existing shared header/footer, naming conventions, `common.js` and API. Each page repeats the same header and footer, so update all five files together.
