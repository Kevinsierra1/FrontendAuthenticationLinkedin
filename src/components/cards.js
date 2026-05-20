export const avatar = (initials) => `<span class="avatar">${initials}</span>`;

export function postCard(post) {
  return `
    <article class="card post-card">
      <header class="post-author">${avatar(post.author.avatar)}<div><strong>${post.author.name}</strong><span>${post.author.title} en ${post.author.company}</span></div></header>
      <p>${post.body}</p>
      <div class="post-stats">${post.likes} reacciones · ${post.comments} comentarios</div>
      <footer class="post-actions">
        <button>Me gusta</button><button>Comentar</button><button>Compartir</button><button>Enviar</button>
      </footer>
    </article>
  `;
}

export function personCard(person, action = "Conectar") {
  return `
    <article class="card person-card">
      ${avatar(person.avatar)}
      <div><strong>${person.name}</strong><span>${person.title}</span><small>${person.location}</small></div>
      <button class="btn btn-secondary">${action}</button>
    </article>
  `;
}
