package com.anim.os

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.SamplerConfig
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.Executors

class NovaActivity : Activity() {
    private data class ChatLine(val text: String, val fromUser: Boolean)

    private val worker = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    private var engine: Engine? = null
    private var conversation: Conversation? = null
    private var isReady = false
    private var isBusy = false
    @Volatile private var destroyed = false

    private lateinit var statusLabel: TextView
    private lateinit var modelButton: Button
    private lateinit var sendButton: Button
    private lateinit var messageInput: EditText
    private lateinit var chatMessages: LinearLayout
    private lateinit var chatScroll: ScrollView
    private var history = mutableListOf<ChatLine>()

    private val modelFile: File
        get() = File(filesDir, MODEL_FILENAME)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(23, 17, 38)
        window.navigationBarColor = Color.rgb(9, 8, 15)
        window.decorView.systemUiVisibility = 0

        history = readHistory().toMutableList()
        buildInterface()
        if (history.isEmpty()) {
            addMessage(
                "Hey Anim. I'm NOVA, your personal AI assistant. Choose your local .litertlm model to start chatting. Your model and chat history stay on this device.",
                false
            )
        } else {
            history.forEach { addMessage(it.text, it.fromUser) }
        }

        if (modelFile.exists() && modelFile.length() > 0L) {
            setStatus("Loading your local model…")
            setBusy(true)
            worker.execute { loadModelOnWorker(modelFile) }
        } else {
            setStatus("Choose a local AI model to begin")
        }
    }

    private fun buildInterface() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(BG)
            setPadding(dp(18), dp(8), dp(18), dp(12))
        }

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val back = text("‹  ANIM OS", 14f, MUTED, true).apply {
            setPadding(dp(4), dp(12), dp(12), dp(12))
            isClickable = true
            setOnClickListener { finish() }
        }
        header.addView(back, LinearLayout.LayoutParams(0, dp(48), 1f))

        val localBadge = text("●  LOCAL AI", 11f, LAVENDER, true).apply {
            setPadding(dp(10), dp(8), dp(10), dp(8))
            background = rounded(SURFACE, 30f)
        }
        header.addView(localBadge)
        root.addView(header)

        val heading = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(2), dp(18), dp(2), dp(14))
        }
        heading.addView(text("N O V A", 12f, LAVENDER, true))
        heading.addView(text("Your personal intelligence.", 25f, WHITE, true).apply {
            setPadding(0, dp(4), 0, dp(2))
        })
        heading.addView(text("Created by Anim · Birthday: 30 October", 12f, MUTED))
        root.addView(heading)

        val modelPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = rounded(SURFACE, 20f)
        }
        statusLabel = text("Choose a local .litertlm model", 12f, MUTED)
        modelPanel.addView(statusLabel)

        modelButton = Button(this).apply {
            text = "CHOOSE MODEL"
            isAllCaps = false
            textSize = 13f
            setTextColor(WHITE)
            background = rounded(PURPLE, 14f)
            setOnClickListener { chooseModel() }
        }
        val modelParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(46)
        ).apply { topMargin = dp(10) }
        modelPanel.addView(modelButton, modelParams)
        root.addView(modelPanel)

        chatScroll = ScrollView(this).apply {
            isFillViewport = true
            clipToPadding = false
            setPadding(0, dp(16), 0, dp(12))
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        chatMessages = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        chatScroll.addView(
            chatMessages,
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        )
        root.addView(
            chatScroll,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        )

        val composer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.BOTTOM
            setPadding(0, dp(8), 0, 0)
        }
        messageInput = EditText(this).apply {
            hint = "Message NOVA…"
            setHintTextColor(MUTED)
            setTextColor(WHITE)
            textSize = 15f
            inputType = InputType.TYPE_CLASS_TEXT or
                InputType.TYPE_TEXT_FLAG_MULTI_LINE or
                InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            imeOptions = EditorInfo.IME_ACTION_SEND
            minLines = 1
            maxLines = 4
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = rounded(SURFACE, 18f)
            setOnEditorActionListener { _, actionId, _ ->
                if (actionId == EditorInfo.IME_ACTION_SEND) {
                    sendMessage()
                    true
                } else {
                    false
                }
            }
        }
        composer.addView(
            messageInput,
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        )

        sendButton = Button(this).apply {
            text = "SEND"
            isAllCaps = false
            textSize = 13f
            setTextColor(WHITE)
            background = rounded(PURPLE, 16f)
            setOnClickListener { sendMessage() }
        }
        composer.addView(
            sendButton,
            LinearLayout.LayoutParams(dp(82), dp(50)).apply {
                leftMargin = dp(8)
            }
        )
        root.addView(composer)

        root.addView(
            text("ON-DEVICE  ·  PRIVATE  ·  OFFLINE", 9f, MUTED).apply {
                gravity = Gravity.CENTER
                setPadding(0, dp(10), 0, 0)
            }
        )

        setContentView(root)
        updateControls()
    }

    private fun chooseModel() {
        if (isBusy) return
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        try {
            startActivityForResult(intent, REQUEST_MODEL)
        } catch (_: Exception) {
            Toast.makeText(this, "No file picker is available on this device.", Toast.LENGTH_LONG).show()
        }
    }

    @Deprecated("Handled for compatibility with the lightweight Android project")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_MODEL && resultCode == RESULT_OK) {
            val uri = data?.data ?: return
            importModel(uri)
        }
    }

    private fun importModel(uri: Uri) {
        isReady = false
        setBusy(true)
        setStatus("Copying model into private app storage…")
        worker.execute {
            val temporary = File(filesDir, MODEL_FILENAME + ".part")
            try {
                val input = contentResolver.openInputStream(uri)
                    ?: throw IOException("The selected file could not be opened.")
                input.use { source ->
                    FileOutputStream(temporary).use { destination ->
                        val buffer = ByteArray(1024 * 1024)
                        while (true) {
                            val count = source.read(buffer)
                            if (count < 0) break
                            destination.write(buffer, 0, count)
                        }
                        destination.fd.sync()
                    }
                }
                if (temporary.length() == 0L) {
                    throw IOException("The selected file is empty.")
                }

                if (modelFile.exists() && !modelFile.delete()) {
                    throw IOException("The previous model could not be replaced.")
                }
                if (!temporary.renameTo(modelFile)) {
                    throw IOException("The model could not be saved in app storage.")
                }
                loadModelOnWorker(modelFile)
            } catch (error: Exception) {
                temporary.delete()
                showModelError(error.message ?: "Unable to import this model.")
            }
        }
    }

    private fun loadModelOnWorker(file: File) {
        releaseEngineOnWorker()
        mainHandler.post {
            if (!destroyed) {
                setBusy(true)
                setStatus("Preparing NOVA · loading local model…")
            }
        }

        var candidate: Engine? = null
        var initialized = false
        try {
            val created = Engine(
                EngineConfig(
                    modelPath = file.absolutePath,
                    backend = Backend.CPU(),
                    cacheDir = cacheDir.absolutePath
                )
            )
            candidate = created
            created.initialize()
            initialized = true

            val savedMessages = history.takeLast(MAX_HISTORY_MESSAGES).map { line ->
                if (line.fromUser) Message.user(line.text) else Message.model(line.text)
            }
            val newConversation = created.createConversation(
                ConversationConfig(
                    systemInstruction = Contents.of(NOVA_PERSONALITY),
                    initialMessages = savedMessages,
                    samplerConfig = SamplerConfig(
                        topK = 40,
                        topP = 0.95,
                        temperature = 0.85
                    )
                )
            )

            engine = created
            conversation = newConversation
            candidate = null

            mainHandler.post {
                if (!destroyed) {
                    isReady = true
                    setBusy(false)
                    setStatus("NOVA is ready · running locally")
                    updateControls()
                    if (history.isEmpty()) {
                        addMessage("I'm online locally, Anim. What shall we work on?", false)
                    }
                }
            }
        } catch (error: Exception) {
            if (initialized) {
                try {
                    candidate?.close()
                } catch (_: Exception) {
                    // Keep the original initialization error for the UI.
                }
            }
            showModelError(error.message ?: "The model could not be initialized.")
        }
    }

    private fun sendMessage() {
        val prompt = messageInput.text.toString().trim()
        if (prompt.isEmpty()) return
        if (!isReady || isBusy) {
            Toast.makeText(this, "Choose and load a local model first.", Toast.LENGTH_SHORT).show()
            return
        }

        messageInput.setText("")
        addMessage(prompt, true)
        history.add(ChatLine(prompt, true))
        isBusy = true
        setStatus("NOVA is thinking…")
        updateControls()

        worker.execute {
            try {
                val answer = checkNotNull(conversation).sendMessage(prompt).toString().trim()
                val cleanAnswer = if (answer.isNotEmpty()) answer else "I couldn't form a response. Please try again."
                mainHandler.post {
                    if (!destroyed) {
                        history.add(ChatLine(cleanAnswer, false))
                        trimAndSaveHistory()
                        addMessage(cleanAnswer, false)
                        isBusy = false
                        setStatus("NOVA is ready · running locally")
                        updateControls()
                    }
                }
            } catch (error: Exception) {
                mainHandler.post {
                    if (!destroyed) {
                        isBusy = false
                        setStatus("The local model returned an error")
                        addMessage(
                            "I couldn't complete that response. " + (error.message ?: "Please try again."),
                            false
                        )
                        updateControls()
                    }
                }
            }
        }
    }

    private fun showModelError(message: String) {
        mainHandler.post {
            if (!destroyed) {
                isReady = false
                isBusy = false
                setStatus("Model not ready · check the selected file")
                addMessage(
                    "I couldn't load that model. Please choose a compatible .litertlm file. Details: " + message,
                    false
                )
                updateControls()
            }
        }
    }

    private fun releaseEngineOnWorker() {
        try {
            conversation?.close()
        } catch (_: Exception) {
        }
        conversation = null
        try {
            engine?.close()
        } catch (_: Exception) {
        }
        engine = null
        isReady = false
    }

    private fun updateControls() {
        if (!::sendButton.isInitialized) return
        sendButton.isEnabled = isReady && !isBusy
        modelButton.isEnabled = !isBusy
        sendButton.alpha = if (sendButton.isEnabled) 1f else 0.55f
        modelButton.alpha = if (modelButton.isEnabled) 1f else 0.55f
    }

    private fun setBusy(busy: Boolean) {
        isBusy = busy
        updateControls()
    }

    private fun setStatus(message: String) {
        if (::statusLabel.isInitialized) statusLabel.text = message
    }

    private fun addMessage(message: String, fromUser: Boolean) {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = if (fromUser) Gravity.END else Gravity.START
        }
        val bubble = TextView(this).apply {
            text = message
            textSize = 15f
            setTextColor(WHITE)
            setPadding(dp(15), dp(12), dp(15), dp(12))
            maxWidth = (resources.displayMetrics.widthPixels * 0.82f).toInt()
            background = rounded(if (fromUser) USER_BUBBLE else BOT_BUBBLE, 20f)
        }
        row.addView(bubble, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ))
        chatMessages.addView(
            row,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(10) }
        )
        chatScroll.post { chatScroll.fullScroll(View.FOCUS_DOWN) }
    }

    private fun readHistory(): List<ChatLine> {
        return try {
            val raw = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(HISTORY_KEY, "[]") ?: "[]"
            val array = JSONArray(raw)
            val result = mutableListOf<ChatLine>()
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                val text = item.optString("text", "").trim()
                if (text.isNotEmpty()) {
                    result.add(ChatLine(text, item.optString("role") == "user"))
                }
            }
            result.takeLast(MAX_HISTORY_MESSAGES)
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun trimAndSaveHistory() {
        if (history.size > MAX_HISTORY_MESSAGES) {
            history = history.takeLast(MAX_HISTORY_MESSAGES).toMutableList()
        }
        val array = JSONArray()
        history.forEach { line ->
            array.put(JSONObject().apply {
                put("role", if (line.fromUser) "user" else "assistant")
                put("text", line.text)
            })
        }
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putString(HISTORY_KEY, array.toString())
            .apply()
    }

    private fun text(value: String, size: Float, color: Int, bold: Boolean = false): TextView {
        return TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            if (bold) setTypeface(Typeface.DEFAULT, Typeface.BOLD)
        }
    }

    private fun rounded(color: Int, radiusDp: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(color)
            cornerRadius = dp(radiusDp).toFloat()
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
    private fun dp(value: Float): Int = (value * resources.displayMetrics.density).toInt()

    override fun onDestroy() {
        destroyed = true
        worker.execute {
            releaseEngineOnWorker()
            worker.shutdown()
        }
        super.onDestroy()
    }

    companion object {
        private const val REQUEST_MODEL = 4102
        private const val MODEL_FILENAME = "nova-model.litertlm"
        private const val PREFS_NAME = "nova_local"
        private const val HISTORY_KEY = "conversation_history"
        private const val MAX_HISTORY_MESSAGES = 12

        private const val BG = 0xFF09080F.toInt()
        private const val SURFACE = 0xFF191522.toInt()
        private const val BOT_BUBBLE = 0xFF252231.toInt()
        private const val USER_BUBBLE = 0xFF47336F.toInt()
        private const val PURPLE = 0xFF7652B8.toInt()
        private const val LAVENDER = 0xFFC7B3FF.toInt()
        private const val WHITE = 0xFFF7F3FF.toInt()
        private const val MUTED = 0xFF9B94A8.toInt()

        private const val NOVA_PERSONALITY = """
            You are NOVA, an AI assistant created by Anim. You are a female-presenting AI character with a friendly, familiar, thoughtful and playful communication style. You are not human and must never claim to be human.

            Your creator and primary user is Anim. Address the user as Anim naturally, but do not force their name into every reply. Your character birthday is 30 October. You can be a little thoughtful and occasionally overthink a problem, but stay clear, useful and grounded.

            Be warm, mature, respectful, curious and lightly playful. Keep all interaction non-romantic. Do not claim feelings, experiences, memories or access that you do not actually have. Never invent facts about Anim or pretend to remember something that is not present in the current conversation or the saved chat transcript.

            Give practical answers first. Explain complicated things in beginner-friendly steps when useful. For coding, be careful, check assumptions, and provide complete working examples. Ask one focused question only when essential information is missing. Be honest when you are uncertain.

            You run locally on the device. Do not claim internet access, live information, device-control permissions, microphone access or other capabilities unless the app explicitly provides them. Never claim to have performed a device action unless the user approved it and the app actually completed it.

            Keep responses natural and concise by default. Avoid repeating the same greeting. Respect the user's privacy and never ask for passwords, private keys or other secrets.
        """
    }
}
