// import "./style.css";
// import MyWorker from './worker.js'
import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
const $ = el => document.querySelector(el)
const $input = $('input')
const $template = $('#message-template')
const $templateBot = $('#message-template-bot')
const $messages = $('ul')
const $container = $('main')
const $button = $('#button-send')
const $downloadButton = $('#button-download')
const $containerDownload = $("#container-download")
const $info = $('small')
const $glow = $('#glow')
const $startText = $('#start-text')


let messages = []
let start = false


let engine
const SELEC_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC-1k"

$downloadButton.addEventListener("click", async () => {
  $downloadButton.setAttribute("disabled", true)
  engine = await CreateWebWorkerMLCEngine(
    new Worker("./worker.js", { type: "module" }),
    SELEC_MODEL,
    {
      initProgressCallback: (info) => {
        $info.textContent = `${info.text}`
        if (info.progress === 1) {
          $glow.style.display = "flex"
          start = true
          $startText.textContent = "Start chatting ^^"
          // console.log($startText)
          $button.removeAttribute("disabled")
        }
      }
    }
  )
})
$input.addEventListener("keypress", (e) => {

  if (e.key === "Enter") {
    if ($input.value.trim() !== "" && start) {
      if ($containerDownload) {
        $containerDownload.style.display = "none"
      }
      engineProcess()
    }
  }
})
$button.addEventListener("click", () => {
  if ($input.value.trim() !== "" && start) {
    if ($containerDownload) {
      $containerDownload.style.display = "none"
    }
    engineProcess()
  }
})
async function engineProcess() {
  const messageText = $input.value.trim()
  if (messageText !== "") {
    //* add message to DOM (USER)-------
    $input.value = ""
    addMessage(messageText, "user")
    $button.setAttribute("disabled", true)
    start = false
    const userMessage = {
      role: "user",
      content: messageText
    }
    messages.push(userMessage)
    $container.scrollTop = $container.scrollHeight
    //* (USER END)-------
    // !Add message to DOM (BOT)-------
    const chunks = await engine.chat.completions.create({
      messages,
      stream: true
    })
    let reply = ""
    const $botMessage = addMessage("", "bot")
    for await (const chunk of chunks) {
      const [choise] = chunk.choices
      const content = choise?.delta?.content ?? ""
      reply += content
      $botMessage.textContent = reply
      $container.scrollTop = $container.scrollHeight
    }
    messages.push({
      role: "assistant",
      content: reply
    })
    $container.scrollTop = $container.scrollHeight
    // !(BOT END)-------
    $button.removeAttribute("disabled")
    start = true
  }
}
function addMessage(text, sender) {
  // clon template
  let clonTemplate = sender === "bot" ? $templateBot.content.cloneNode(true) : $template.content.cloneNode(true)
  const $newMessage = clonTemplate.querySelector(".message")
  const $who = $newMessage.querySelector("span")
  const $text = $newMessage.querySelector("p")

  $text.textContent = text
  $who.textContent = sender === "bot" ? "Phi" : "You"
  $newMessage.classList.add(sender)

  $messages.appendChild($newMessage)
  $container.scrollTop = $container.scrollHeight
  return $text
}