// Chemistry in Canada — scroll interactions
// Two jobs: (1) fade/rise reveal for .reveal elements, (2) drive the
// sticky visual-story sequences by activating the frame/step whose
// step element is nearest the middle of the viewport.

document.addEventListener("DOMContentLoaded", function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- generic reveal-on-scroll ----
  var revealTargets = document.querySelectorAll(".reveal, .reveal-scale");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- sticky visual-story sequences ----
  // Tracks which step's centre is nearest the viewport centre on every scroll,
  // rather than relying on IntersectionObserver enter/exit events — a fast
  // scroll (wheel flick, trackpad fling, Page Down) can jump clean over a
  // step's narrow trigger band and skip its enter/exit event entirely, which
  // would leave the sticky visual stuck on an earlier stage. Recomputing the
  // nearest step directly from layout on every scroll tick is immune to that.
  var storyRigs = [];
  var stories = document.querySelectorAll("[data-story]");
  stories.forEach(function (story) {
    var steps = Array.prototype.slice.call(story.querySelectorAll(".story__step"));
    var frames = Array.prototype.slice.call(story.querySelectorAll(".story__frame"));
    if (!steps.length || !frames.length) return;

    function activate(index) {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      frames.forEach(function (f, i) { f.classList.toggle("is-active", i === index); });
    }

    activate(0);

    if (reduceMotion) {
      frames.forEach(function (f) { f.classList.add("is-active"); f.style.position = "static"; f.style.opacity = 1; });
      return;
    }

    storyRigs.push({ steps: steps, activate: activate, current: 0 });
  });

  if (storyRigs.length) {
    var ticking = false;

    function updateStories() {
      ticking = false;
      var viewportCentre = window.innerHeight / 2;
      storyRigs.forEach(function (rig) {
        var nearestIndex = rig.current;
        var nearestDist = Infinity;
        rig.steps.forEach(function (step, i) {
          var rect = step.getBoundingClientRect();
          var stepCentre = rect.top + rect.height / 2;
          var dist = Math.abs(stepCentre - viewportCentre);
          if (dist < nearestDist) { nearestDist = dist; nearestIndex = i; }
        });
        if (nearestIndex !== rig.current) {
          rig.current = nearestIndex;
          rig.activate(nearestIndex);
        }
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateStories);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateStories();
  }

  // ---- definition tooltips: make them tap-friendly on touch devices ----
  var defs = document.querySelectorAll("dfn[data-def]");
  defs.forEach(function (d) {
    d.setAttribute("tabindex", "0");
  });
});
