const API_URL = '/api/articles';

// DOM Elements
const form = document.getElementById('article-form');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const tagsInput = document.getElementById('tags');
const contentInput = document.getElementById('content');
const idInput = document.getElementById('article-id');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const articlesList = document.getElementById('articles-list');
const articleCount = document.getElementById('article-count');

// State
let articles = [];

// Initialize
document.addEventListener('DOMContentLoaded', fetchArticles);

// Event Listeners
form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);

// Fetch all articles
async function fetchArticles() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch articles');
    
    articles = await response.json();
    renderArticles();
  } catch (error) {
    console.error('Error fetching articles:', error);
    articlesList.innerHTML = `<div class="empty-state" style="color: var(--danger)">Error loading articles. Is the backend running?</div>`;
  }
}

// Render articles to the DOM
function renderArticles() {
  articleCount.textContent = articles.length;
  
  if (articles.length === 0) {
    articlesList.innerHTML = `<div class="empty-state">No articles found. Create one above!</div>`;
    return;
  }

  articlesList.innerHTML = articles.map(article => `
    <div class="article-card">
      <div class="article-header">
        <h3 class="article-title">${escapeHTML(article.title)}</h3>
      </div>
      <div class="article-meta">
        By ${escapeHTML(article.author)} &bull; ${new Date(article.createdAt).toLocaleDateString()}
      </div>
      <div class="article-content">
        ${escapeHTML(article.content)}
      </div>
      ${article.tags && article.tags.length > 0 ? `
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="article-actions">
        <button class="btn btn-edit" onclick="editArticle('${article._id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteArticle('${article._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Handle form submission (Create or Update)
async function handleSubmit(e) {
  e.preventDefault();

  // Parse comma separated tags
  const tagsStr = tagsInput.value.trim();
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

  const articleData = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    content: contentInput.value.trim(),
    tags: tags
  };

  const articleId = idInput.value;
  
  try {
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    let response;
    
    if (articleId) {
      // Update existing article
      response = await fetch(`${API_URL}/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
    } else {
      // Create new article
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save article');
    }

    // Refresh list and reset form
    await fetchArticles();
    resetForm();
    
  } catch (error) {
    console.error('Error saving article:', error);
    alert(`Error: ${error.message}`);
  } finally {
    submitBtn.textContent = articleId ? 'Update Article' : 'Publish Article';
    submitBtn.disabled = false;
  }
}

// Prepare form for editing an article
function editArticle(id) {
  const article = articles.find(a => a._id === id);
  if (!article) return;

  idInput.value = article._id;
  titleInput.value = article.title;
  authorInput.value = article.author;
  contentInput.value = article.content;
  tagsInput.value = article.tags ? article.tags.join(', ') : '';

  formTitle.textContent = 'Edit Article';
  submitBtn.textContent = 'Update Article';
  cancelBtn.classList.remove('hidden');
  
  // Smooth scroll to form
  document.querySelector('.editor-section').scrollIntoView({ behavior: 'smooth' });
}

// Reset form back to create mode
function resetForm() {
  form.reset();
  idInput.value = '';
  formTitle.textContent = 'Create New Article';
  submitBtn.textContent = 'Publish Article';
  cancelBtn.classList.add('hidden');
}

// Delete an article
async function deleteArticle(id) {
  if (!confirm('Are you sure you want to delete this article?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete article');

    // Remove from UI immediately for better UX
    articles = articles.filter(a => a._id !== id);
    renderArticles();
    
    // If the deleted article was being edited, reset form
    if (idInput.value === id) {
      resetForm();
    }
  } catch (error) {
    console.error('Error deleting article:', error);
    alert('Failed to delete the article.');
  }
}

// Utility to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
