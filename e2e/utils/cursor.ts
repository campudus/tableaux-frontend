export async function showCursor(page) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "__pw_cursor";
      Object.assign(cursor.style, {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "15px",
        height: "15px",
        background: "red",
        borderRadius: "50%",
        zIndex: "999999",
        pointerEvents: "none",
        transition: "top 0.1s linear, left 0.1s linear"
      });
      document.body.appendChild(cursor);

      document.addEventListener("mousemove", e => {
        const el = document.getElementById("__pw_cursor");
        if (el) {
          el.style.left = e.clientX - 10 + "px";
          el.style.top = e.clientY - 10 + "px";
        }
      });

      document.addEventListener("mousedown", () => {
        const el = document.getElementById("__pw_cursor");
        if (el) {
          el.style.background = "blue";
          el.style.transform = "scale(0.8)";
        }
      });

      document.addEventListener("mouseup", () => {
        const el = document.getElementById("__pw_cursor");
        if (el) {
          el.style.background = "red";
          el.style.transform = "scale(1)";
        }
      });
    });
  });
}
