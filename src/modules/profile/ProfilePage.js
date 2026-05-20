import { AppService } from "../../services/app.service.js";
import { userStore } from "../../core/state/stores.js";

export function ProfilePage({ params }) {
  return {
    html: `<section data-profile-page><div class="skeleton tall"></div></section>`,
    async afterRender() {
      await AppService.loadProfile(params.id || "me");
      const profile = userStore.getState().profile;
      document.querySelector("[data-profile-page]").innerHTML = `
        <article class="profile-page">
          <header class="profile-hero card">
            <button class="upload cover-upload">Subir cover</button>
            <div class="cover profile-cover"></div>
            <span class="avatar xl">${profile.avatar}</span>
            <button class="upload avatar-upload">Subir avatar</button>
            <h1 contenteditable="true">${profile.name}</h1>
            <p contenteditable="true">${profile.title} · ${profile.company}</p>
            <small>${profile.location}</small>
          </header>
          ${section("About", profile.about, true)}
          ${section("Experience", profile.experience)}
          ${section("Education", profile.education)}
          ${section("Skills", profile.skills)}
          ${section("Activity", ["Publico 3 articulos esta semana", "Comento en conversaciones de arquitectura"])}
          ${section("Connections", ["584 conexiones profesionales"])}
        </article>
      `;
    }
  };
}

function section(title, content, editable = false) {
  const body = Array.isArray(content) ? `<ul>${content.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p ${editable ? "contenteditable='true'" : ""}>${content}</p>`;
  return `<section class="card profile-section"><h2>${title}</h2>${body}</section>`;
}
