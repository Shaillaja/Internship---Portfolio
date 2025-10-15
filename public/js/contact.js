const $ = (id) => document.getElementById(id);

function showToast(msg, ok=true){
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.borderColor = ok ? "#2d3571" : "#6b1e2a";
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 2800);
}

function setError(id, msg){
  const el = $("err-"+id);
  if(el) el.textContent = msg || "";
}

function validate(){
  let ok = true;
  // name
  const name = $("name").value.trim();
  if (name.length < 2){
    setError("name", "Please enter your name.");
    ok = false;
  } else setError("name", "");

  // email
  const email = $("email").value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)){
    setError("email", "Please enter a valid email.");
    ok = false;
  } else setError("email", "");

  // message
  const msg = $("message").value.trim();
  if (msg.length < 10){
    setError("message", "Message is too short (min 10 chars).");
    ok = false;
  } else setError("message", "");

  // honeypot
  if (($("company").value || "").trim().length){
    ok = false; // bot
  }
  return ok;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("contactForm");
  const btn  = $("sendBtn");
  const note = $("formNote");
  const msg  = $("message");
  const msgCount = $("msgCount");

  // live counter
  msg.addEventListener("input", () => {
    msgCount.textContent = `${msg.value.length} / ${msg.maxLength}`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    note.textContent = "";

    if (!validate()){
      showToast("Fix the highlighted fields.", false);
      return;
    }

    btn.disabled = true; btn.textContent = "Sending…";
    try{
      const payload = {
        name: $("name").value.trim(),
        email: $("email").value.trim(),
        message: $("message").value.trim()
      };
      const r = await fetch("/api/contact", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const data = await r.json();

      if (!r.ok){
        // server-side validation echo
        if (data?.errors){
          for(const k of Object.keys(data.errors)){
            setError(k, data.errors[k]);
          }
        }
        showToast("Could not send. Please review the form.", false);
        note.textContent = "There were issues with your submission.";
      } else {
        showToast("Thanks! Your message has been sent.");
        note.textContent = "Success — I’ll get back to you soon.";
        form.reset(); msgCount.textContent = "0 / 1000";
      }
    }catch(err){
      console.error(err);
      showToast("Network issue. Try again later.", false);
      note.textContent = "Network error; please try again.";
    }finally{
      btn.disabled = false; btn.textContent = "Send";
    }
  });
});
