// visual_test.js
// Automatización de pruebas visuales con Playwright para la consola de Axyntrax y Cecilia Bot
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'http://localhost:5000/dashboard';
  const outDir = path.resolve(__dirname, 'visual_test_results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  console.log(`\n==========================================`);
  console.log(`🤖 INICIANDO PRUEBA VISUAL EN: ${url}`);
  console.log(`==========================================\n`);

  const browser = await chromium.launch({ headless: true, args: ['--start-maximized'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 800 } }
  });
  const page = await context.newPage();

  const logs = { console: [], responses: [], errors: [] };
  page.on('console', msg => logs.console.push({ type: msg.type(), text: msg.text() }));
  page.on('response', resp => logs.responses.push({ url: resp.url(), status: resp.status() }));
  page.on('pageerror', err => logs.errors.push({ message: err.message, stack: err.stack }));

  const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // 1) Carga de la consola principal
    console.log('⏳ Cargando página...');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const mainShot = path.join(outDir, `home_${timestamp()}.png`);
    await page.screenshot({ path: mainShot, fullPage: true });
    console.log(`[OK] Consola cargada. Captura guardada en: ${path.basename(mainShot)}`);

    // 2) Análisis de enlaces de navegación
    const menuLinks = await page.$$eval('a', nodes => nodes.slice(0, 12).map(n => ({ href: n.href, text: n.innerText.slice(0, 60) })));
    fs.writeFileSync(path.join(outDir, 'menu_links.json'), JSON.stringify(menuLinks, null, 2));
    console.log(`[OK] ${menuLinks.length} enlaces de menú identificados y guardados.`);

    // 3) Interacción simulada con el chatbot Cecilia
    console.log('💬 Localizando cuadro de chat de Cecilia...');
    const input = await page.$('textarea, input[type="text"]');
    let chatResult = { found: !!input, attempts: [] };
    
    if (input) {
      try {
        console.log('✍️ Escribiendo mensaje de prueba para Cecilia...');
        await input.fill('Hola Cecilia, prueba de sistema (auditoría visual)');
        
        // Localizar botón de enviar
        const sendBtn = await page.$('button#send-btn, button:has-text("Enviar"), button');
        if (sendBtn) {
          console.log('🖱️ Haciendo clic en el botón Enviar...');
          await sendBtn.click();
        } else {
          console.log('⌨️ Enviando mensaje presionando la tecla Enter...');
          await input.press('Enter');
        }
        
        console.log('⏳ Esperando la respuesta inteligente del chatbot...');
        await page.waitForTimeout(4000); // Dar margen para ver la respuesta en pantalla
        
        const chatShot = path.join(outDir, `chat_response_${timestamp()}.png`);
        await page.screenshot({ path: chatShot });
        chatResult.attempts.push({ success: true, screenshot: chatShot });
        console.log(`[OK] Interacción completada. Captura guardada en: ${path.basename(chatShot)}`);
      } catch (e) {
        chatResult.attempts.push({ success: false, error: e.message });
        console.error(`[ERR] Error durante la interacción de chat: ${e.message}`);
      }
    } else {
      console.warn('[WARN] No se detectó la caja de entrada de texto del chat.');
      chatResult.note = 'No se encontró selector de chat genérico.';
    }
    fs.writeFileSync(path.join(outDir, 'chat_result.json'), JSON.stringify(chatResult, null, 2));

    // 4) Chequeo de estados e incidencias de red
    const statusChecks = {
      title: await page.title(),
      url: page.url(),
      has404: logs.responses.some(r => r.status === 404),
      has500: logs.responses.some(r => r.status >= 500)
    };
    fs.writeFileSync(path.join(outDir, 'status_checks.json'), JSON.stringify(statusChecks, null, 2));

    // Guardar logs completos para auditoría
    fs.writeFileSync(path.join(outDir, 'console_logs.json'), JSON.stringify(logs.console, null, 2));
    fs.writeFileSync(path.join(outDir, 'responses.json'), JSON.stringify(logs.responses, null, 2));
    fs.writeFileSync(path.join(outDir, 'errors.json'), JSON.stringify(logs.errors, null, 2));

    const summary = {
      url,
      timestamp: new Date().toISOString(),
      menuLinksCount: menuLinks.length,
      chatResult,
      statusChecks,
      resultsDirectory: outDir
    };
    fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    
    console.log(`\n==========================================`);
    console.log(`🎉 ¡PRUEBA VISUAL COMPLETADA CON ÉXITO!`);
    console.log(`📁 Resultados guardados en: ${outDir}`);
    console.log(`==========================================\n`);
  } catch (err) {
    console.error(`[FATAL] Error crítico durante la prueba: ${err.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
})();
