const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const port = 3000;

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Rota para criar pedido
app.post('/api/create', upload.array('photos', 5), async (req, res) => {
    try {
        const { lovedName, message, spotifyLink } = req.body;
        const photos = req.files.map(file => `/uploads/${file.filename}`);
        
        // Criar objeto do pedido
        const pedido = {
            id: Date.now().toString(),
            lovedName,
            message,
            photos,
            spotifyLink,
            createdAt: new Date().toISOString()
        };

        // Salvar em um arquivo JSON
        const pedidosFile = 'pedidos.json';
        let pedidos = [];
        
        if (fs.existsSync(pedidosFile)) {
            pedidos = JSON.parse(fs.readFileSync(pedidosFile));
        }
        
        pedidos.push(pedido);
        fs.writeFileSync(pedidosFile, JSON.stringify(pedidos, null, 2));

        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para buscar pedido
app.get('/api/pedido/:id', (req, res) => {
    try {
        const pedidosFile = 'pedidos.json';
        if (!fs.existsSync(pedidosFile)) {
            return res.status(404).json({ error: 'Nenhum pedido encontrado' });
        }

        const pedidos = JSON.parse(fs.readFileSync(pedidosFile));
        const pedido = pedidos.find(p => p.id === req.params.id);
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer((req, res) => {
    // Servir o arquivo index.html
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Erro ao carregar o arquivo');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    }
});

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 