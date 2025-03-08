// Variável para armazenar a Bíblia carregada
let bibleData = null;

// Função para verificar dinamicamente as Bíblias disponíveis
async function loadAvailableBibles() {
    try {
        // Tenta carregar o índice de Bíblias disponíveis
        const response = await fetch('assets/data/bibles/index.json');
        
        if (response.ok) {
            const biblesList = await response.json();
            populateBiblesSelect(biblesList);
        } else {
            console.error('Arquivo index.json não encontrado. Nenhuma Bíblia disponível para carregar.');
            // Mantém o select com apenas a opção padrão
        }
    } catch (error) {
        console.error('Erro ao carregar lista de Bíblias:', error);
    }
}

// Função para preencher o select com as Bíblias disponíveis
function populateBiblesSelect(biblesList) {
    const selectElement = document.getElementById('bible-select');
    
    // Limpar opções existentes, exceto a primeira (placeholder)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    // Adicionar as Bíblias disponíveis como opções
    biblesList.forEach(bible => {
        const option = document.createElement('option');
        option.value = bible.id;
        option.textContent = bible.name;
        selectElement.appendChild(option);
    });

    // Adicionar opção "Fazer upload..."
    const uploadOption = document.createElement('option');
    uploadOption.value = "upload";
    uploadOption.textContent = "Fazer upload...";
    selectElement.appendChild(uploadOption);

    // Selecionar automaticamente a primeira tradução disponível
    if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0;
        
        // Acionar o evento change manualmente para carregar a Bíblia selecionada
        const changeEvent = new Event('change');
        selectElement.dispatchEvent(changeEvent);
    }
}

// Carregar Bíblias disponíveis quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadAvailableBibles();
    fetchRepositoryInfo();
    updateUploadContainerVisibility();
    setupExpandableSection(); // Nova função para configurar a seção expansível
    
    // Adicionar event listener para o select de bíblias
    document.getElementById('bible-select').addEventListener('change', function() {
        updateUploadContainerVisibility();
    });
});

// Nova função para mostrar/esconder o container de upload
function updateUploadContainerVisibility() {
    const selectElement = document.getElementById('bible-select');
    const fileInputContainer = document.querySelector('.file-input-container');
    
    if (selectElement.value === "upload") {
        fileInputContainer.style.display = 'block';
    } else {
        fileInputContainer.style.display = 'none';
    }
}

// Função para carregar Bíblias predefinidas
document.getElementById('bible-select').addEventListener('change', async function() {
    const bibleName = this.value;
    const uploadStatus = document.getElementById('upload-status');
    
    if (!bibleName) {
        return; // Se for a opção vazia ("Selecione uma tradução..."), não faz nada
    }
    
    if (bibleName === "upload") {
        // Se for a opção "Fazer upload...", apenas exibe o container de upload
        return;
    }
    
    try {
        uploadStatus.innerHTML = '<span>Carregando...</span>';
        
        // Carregar o arquivo JSON da pasta de Bíblias
        const response = await fetch(`assets/data/bibles/json/${bibleName}.json`);
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar arquivo: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.bible && data.bible.books) {
            bibleData = data;
            uploadStatus.innerHTML = `<span class="success">Bíblia carregada com sucesso: ${bibleData.bible.name}. ${bibleData.bible.books.length} livros disponíveis.</span>`;
            
            // Preencher e mostrar a barra lateral com os livros disponíveis
            populateBooksSidebar(bibleData.bible.books);
            
            // Atualizar o resultado se já houver uma referência
            const reference = document.getElementById('reference').value.trim();
            if (reference) {
                searchVerse();
            }
        } else {
            uploadStatus.innerHTML = '<span class="error">O arquivo não contém uma estrutura válida da Bíblia.</span>';
            bibleData = null;
        }
    } catch (error) {
        console.error('Erro ao carregar a Bíblia:', error);
        uploadStatus.innerHTML = `<span class="error">Falha ao carregar a Bíblia: ${error.message}</span>`;
    }
});

// Função para fazer upload do arquivo JSON
document.getElementById('upload-button').addEventListener('click', async function() {
    const fileInput = document.getElementById('bible-file');
    const uploadStatus = document.getElementById('upload-status');
    
    // Resetar seleção da combobox
    document.getElementById('bible-select').selectedIndex = 0;
    
    // Remover seleção de qualquer Bíblia predefinida
    document.querySelectorAll('.bible-option').forEach(btn => btn.classList.remove('selected'));
    
    if (fileInput.files.length === 0) {
        uploadStatus.innerHTML = '<span class="error">Nenhum arquivo selecionado.</span>';
        return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        uploadStatus.innerHTML = '<span class="error">Por favor, selecione um arquivo JSON válido.</span>';
        return;
    }
    
    try {
        const fileReader = new FileReader();
        
        fileReader.onload = function(event) {
            try {
                bibleData = JSON.parse(event.target.result);
                if (bibleData && bibleData.bible && bibleData.bible.books) {
                    uploadStatus.innerHTML = `<span class="success">Bíblia carregada com sucesso: ${bibleData.bible.name}. ${bibleData.bible.books.length} livros disponíveis.</span>`;
                    
                    // Preencher e mostrar a barra lateral com os livros disponíveis
                    populateBooksSidebar(bibleData.bible.books);
                    
                    // Atualizar o resultado se já houver uma referência
                    const reference = document.getElementById('reference').value.trim();
                    if (reference) {
                        searchVerse();
                    }
                } else {
                    uploadStatus.innerHTML = '<span class="error">O arquivo não contém uma estrutura válida da Bíblia.</span>';
                    bibleData = null;
                }
            } catch (parseError) {
                console.error('Erro ao processar JSON:', parseError);
                uploadStatus.innerHTML = '<span class="error">O arquivo não contém um JSON válido.</span>';
                bibleData = null;
            }
        };
        
        fileReader.onerror = function() {
            uploadStatus.innerHTML = '<span class="error">Erro ao ler o arquivo.</span>';
        };
        
        fileReader.readAsText(file);
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        uploadStatus.innerHTML = '<span class="error">Erro ao processar o arquivo.</span>';
    }
});

// Função para preencher a barra lateral com os livros da Bíblia
function populateBooksSidebar(books) {
    const bookList = document.getElementById('book-list');
    const sidebar = document.getElementById('sidebar');
    
    // Limpar lista atual
    bookList.innerHTML = '';
    
    // Adicionar cada livro à lista
    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item';
        bookElement.textContent = book.abbreviation || book.name.substring(0, 3);
        bookElement.title = book.name;
        
        // Adicionar evento de clique para preencher automaticamente o campo de busca apenas com a abreviação
        bookElement.addEventListener('click', function() {
            document.getElementById('reference').value = `${book.abbreviation || book.name.substring(0, 3)}`;
            document.getElementById('reference').focus();
        });
        
        bookList.appendChild(bookElement);
    });
    
    // Tornar a barra lateral visível
    sidebar.classList.add('visible');
}

// Função para analisar referências complexas
function parseReference(reference) {
    // Padrão básico: Livro Capítulo[,Versículo(s)]
    const basicPattern = /^([A-Za-z0-9]+)\s+(\d+)(?:,(.+))?$/;
    const match = reference.match(basicPattern);
    
    if (!match) {
        return null;
    }
    
    const [, bookAbbr, chapter, verseRef] = match;
    
    // Se não houver referência de versículo, é o capítulo inteiro
    if (!verseRef) {
        return {
            book: bookAbbr,
            chapter: parseInt(chapter),
            verses: 'all'
        };
    }
    
    // Analisar a parte de versículos (pode conter múltiplas referências separadas por ponto)
    const verseSegments = verseRef.split('.');
    let verses = [];
    
    for (const segment of verseSegments) {
        // Verificar se é um intervalo (ex: 5-7) ou um único versículo
        if (segment.includes('-')) {
            const [start, end] = segment.split('-').map(v => parseInt(v.trim()));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    verses.push(i);
                }
            }
        } else {
            const verseNumber = parseInt(segment.trim());
            if (!isNaN(verseNumber)) {
                verses.push(verseNumber);
            }
        }
    }
    
    return {
        book: bookAbbr,
        chapter: parseInt(chapter),
        verses: verses
    };
}

// Função para buscar o versículo
async function searchVerse() {
    const reference = document.getElementById('reference').value.trim();
    const resultElement = document.getElementById('result');
    const copyButton = document.getElementById('copy-button');
    
    // Ocultar botão de copiar ao iniciar nova busca
    copyButton.classList.remove('visible');
    
    // Verificar se a Bíblia foi carregada
    if (!bibleData) {
        resultElement.innerHTML = '<span class="error">É necessário carregar o arquivo da Bíblia primeiro.</span>';
        return;
    }
    
    // Analisar a referência
    const parsedRef = parseReference(reference);
    
    if (!parsedRef) {
        resultElement.innerHTML = '<span class="error">Formato inválido. Exemplos válidos:<br>Gn 30,5 - Um único versículo<br>Gn 30,5-7 - Intervalo de versículos<br>Gn 30 - Capítulo inteiro<br>Gn 30,5-7.15.20-25 - Combinação de versículos</span>';
        return;
    }
    
    // Encontrar o livro
    const book = bibleData.bible.books.find(b => 
        b.abbreviation.toLowerCase() === parsedRef.book.toLowerCase() || 
        b.name.toLowerCase().startsWith(parsedRef.book.toLowerCase())
    );
    
    if (!book) {
        resultElement.innerHTML = `<span class="error">Livro "${parsedRef.book}" não encontrado.</span>`;
        return;
    }
    
    // Verificar se o capítulo existe
    const chapterIndex = parsedRef.chapter - 1;
    if (chapterIndex < 0 || chapterIndex >= book.chapters.length) {
        resultElement.innerHTML = `<span class="error">Capítulo ${parsedRef.chapter} não encontrado em ${book.name}.</span>`;
        return;
    }
    
    // Preparar o HTML para exibir os versículos
    let resultHTML = `<div class="reference">${book.name}</div>`;
    
    // Capítulo inteiro
    if (parsedRef.verses === 'all') {
        const allVerses = [];
        
        for (let i = 0; i < book.chapters[chapterIndex].length; i++) {
            const verseText = book.chapters[chapterIndex][i];
            if (verseText) { // Verifica se o versículo existe e não é vazio
                allVerses.push(verseText);
            }
        }
        
        // Concatenar todos os versículos com espaço
        resultHTML += `<div class="verse-text">${allVerses.join(' ')}</div>`;
    } 
    // Versículos específicos
    else {
        // Ordenar os versículos para garantir que estejam em ordem crescente
        parsedRef.verses.sort((a, b) => a - b);
        
        const verseTexts = [];
        let previousVerseNumber = -1;
        
        for (let i = 0; i < parsedRef.verses.length; i++) {
            const verseNumber = parsedRef.verses[i];
            const verseIndex = verseNumber - 1;
            
            // Se não for o primeiro versículo e houver lacuna entre os versículos, adicione o marcador de omissão
            if (previousVerseNumber !== -1 && verseNumber > previousVerseNumber + 1) {
                verseTexts.push('[...]');
            }
            
            if (verseIndex >= 0 && verseIndex < book.chapters[chapterIndex].length) {
                const verseText = book.chapters[chapterIndex][verseIndex];
                if (verseText) { // Verifica se o versículo existe e não é vazio
                    verseTexts.push(verseText);
                }
            }
            
            previousVerseNumber = verseNumber;
        }
        
        // Concatenar os versículos com espaço
        resultHTML += `<div class="verse-text">${verseTexts.join(' ')}</div>`;
    }
    
    resultElement.innerHTML = resultHTML;
    
    // Exibir o botão de copiar apenas quando temos um resultado válido
    if (resultHTML.includes('verse-text')) {
        copyButton.classList.add('visible');
    }
}

// Função de debounce para limitar a frequência de chamadas
function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// Versão com debounce da função searchVerse
const debouncedSearchVerse = debounce(() => {
    searchVerse();
});

// Adicionar evento de clique ao botão
document.getElementById('search').addEventListener('click', searchVerse);

// Adicionar evento de tecla Enter no campo de entrada
document.getElementById('reference').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchVerse();
    }
});

// Novo: Adicionar evento de input para busca automática enquanto digita
document.getElementById('reference').addEventListener('input', debouncedSearchVerse);

// Função para copiar o texto bíblico para o clipboard
document.getElementById('copy-button').addEventListener('click', function() {
    // Selecionar apenas o texto bíblico, não a referência
    const verseTextElement = document.querySelector('.verse-text');
    
    if (verseTextElement) {
        const textToCopy = verseTextElement.textContent;
        
        // Copiar para a área de transferência
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Feedback visual de sucesso
            const copyButton = document.getElementById('copy-button');
            copyButton.textContent = 'Copiado!';
            copyButton.classList.add('success');
            
            // Restaurar o botão após 2 segundos
            setTimeout(() => {
                copyButton.textContent = 'Copiar';
                copyButton.classList.remove('success');
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
            alert('Não foi possível copiar o texto. Seu navegador pode não suportar esta funcionalidade.');
        });
    }
});

// Função para buscar informações do repositório GitHub
async function fetchRepositoryInfo() {
    const repoInfoDiv = document.getElementById('repo-info');
    
    try {
        // Obter o nome do usuário e do repositório da URL atual
        const urlParts = window.location.hostname.split('.');
        let username, repoName;
        
        if (window.location.hostname.includes('github.io')) {
            // Formato: username.github.io/repo-name
            username = urlParts[0];
            repoName = window.location.pathname.split('/')[1];
        } else {
            // URL customizada ou ambiente local - usar valores padrão
            // Extrair do "origin" do git se possível
            const metaTag = document.querySelector('meta[name="github-repo"]');
            if (metaTag) {
                const repoPath = metaTag.getAttribute('content');
                [username, repoName] = repoPath.split('/');
            } else {
                throw new Error('Não foi possível ler o remote do repositório git.');
            }
        }

        // Se estiver rodando localmente, usar um valor padrão
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            const pathSegments = window.location.pathname.split('/');
            repoName = pathSegments.find(s => s.length > 0 && s !== 'index.html') || 'open-bible';
        }

        if (!username || !repoName) {
            throw new Error('Não foi possível determinar o repositório GitHub.');
        }

        // Buscar informações do repositório via API GitHub
        const apiUrl = `https://api.github.com/repos/${username}/${repoName}`;
        const repoResponse = await fetch(apiUrl);
        const repoData = await repoResponse.json();
        
        if (repoData.message === 'Not Found') {
            throw new Error('Repositório não encontrado.');
        }

        // Buscar informações do commit mais recente da branch master
        const commitsUrl = `${apiUrl}/commits?sha=master&per_page=1`;
        const commitsResponse = await fetch(commitsUrl);
        const commits = await commitsResponse.json();
        
        if (commits.length === 0) {
            throw new Error('Não foi possível obter o último commit da branch master.');
        }
        
        const latestCommitSha = commits[0].sha;
        
        // Buscar tags (versões)
        const tagsUrl = `${apiUrl}/tags?per_page=10`;
        const tagsResponse = await fetch(tagsUrl);
        const allTags = await tagsResponse.json();
        
        // Verificar se alguma tag aponta para o último commit da master
        let matchingTag = null;
        
        // Verificar cada tag para ver se aponta para o último commit da master
        for (const tag of allTags) {
            // Buscar detalhes da tag para obter o SHA do commit
            const tagCommitUrl = `${apiUrl}/git/refs/tags/${tag.name}`;
            try {
                const tagResponse = await fetch(tagCommitUrl);
                const tagData = await tagResponse.json();
                
                // Verificar se a tag é uma tag anotada (object.type === 'tag') ou uma tag leve
                if (tagData.object && tagData.object.type === 'tag') {
                    // Para tags anotadas, precisamos obter o commit relacionado
                    const tagObjUrl = tagData.object.url;
                    const tagObjResponse = await fetch(tagObjUrl);
                    const tagObj = await tagObjResponse.json();
                    
                    if (tagObj.object && tagObj.object.sha === latestCommitSha) {
                        matchingTag = tag;
                        break;
                    }
                } else if (tagData.object && tagData.object.sha === latestCommitSha) {
                    // Tag leve, verificamos diretamente o SHA
                    matchingTag = tag;
                    break;
                }
            } catch (error) {
                console.error(`Erro ao verificar a tag ${tag.name}:`, error);
                continue; // Continuar verificando outras tags
            }
        }
        
        // Montar informação para exibição
        let infoHtml = `<a href="${repoData.html_url}/tree/master" target="_blank">${repoData.full_name}</a> (branch: master) - `;
        
        // Só mostrar a tag se ela corresponder ao último commit
        if (matchingTag) {
            infoHtml += `Versão: <strong>${matchingTag.name}</strong>, `;
        }
        
        if (commits.length > 0) {
            const commitDate = new Date(commits[0].commit.author.date);
            const formattedDate = `${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, '0')}-${String(commitDate.getDate()).padStart(2, '0')}`;
            infoHtml += `Commit: <a href="${commits[0].html_url}" target="_blank">${commits[0].sha.substring(0, 7)}</a> (${formattedDate})`;
        }
        
        repoInfoDiv.innerHTML = `<p>${infoHtml}</p>`;
        
    } catch (error) {
        console.error('Erro ao buscar informações do repositório:', error);
    }
}

// Executar a função quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', fetchRepositoryInfo);

// Função para configurar a seção expansível "Como usar"
function setupExpandableSection() {
    const header = document.querySelector('.expandable-header');
    const content = document.querySelector('.expandable-content');
    const formatInstructions = document.querySelector('.format-instructions');
    
    if (header && content) {
        // Iniciar com a seção colapsada
        content.classList.remove('expanded');
        formatInstructions.classList.remove('expanded');
        
        // Adicionar evento de clique
        header.addEventListener('click', function() {
            content.classList.toggle('expanded');
            formatInstructions.classList.toggle('expanded');
        });
    }
}
