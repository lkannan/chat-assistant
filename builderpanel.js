(function() {
    let template = document.createElement("template");
    template.innerHTML = `
      <form id="form">
        <fieldset>
          <legend>Generative AI Chat Widget Settings</legend>
          <table>
            <tr>
              <td>Google API Key</td>
              <td><input id="builder_apiKey" type="password" size="40"></td>
            </tr>
            <tr>
              <td>System Prompt</td>
              <td><textarea id="builder_systemPrompt" rows="4" cols="40"></textarea></td>
            </tr>
            <tr>
              <td colspan="2">
                <div class="info-box">
                  <p><strong>API Key Instructions:</strong></p>
                  <ol>
                    <li>Create a Google Cloud project</li>
                    <li>Enable the Generative Language API</li>
                    <li>Create an API key in the Google Cloud Console</li>
                    <li>Paste the API key above</li>
                  </ol>
                  <p><strong>Note:</strong> The API key is stored securely and is not visible to end users.</p>
                </div>
              </td>
            </tr>
          </table>
          <input type="submit" style="display:none;">
        </fieldset>
      </form>
      <style>
        :host {
          display: block;
          padding: 1em;
        }
        fieldset {
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        legend {
          font-weight: bold;
          color: #0076d6;
        }
        table {
          width: 100%;
        }
        td {
          padding: 8px;
          vertical-align: top;
        }
        input, textarea {
          width: 100%;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
          font-family: inherit;
          font-size: 14px;
        }
        input[type="password"] {
          letter-spacing: 0.1em;
        }
        .info-box {
          background-color: #f8f8f8;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          margin-top: 10px;
          font-size: 12px;
        }
        .info-box p {
          margin: 5px 0;
        }
        .info-box ol {
          margin: 5px 0;
          padding-left: 20px;
        }
      </style>
    `;
  
    class GenAIChatWidgetBuilderPanel extends HTMLElement {
      constructor() {
        super();
        this._shadowRoot = this.attachShadow({mode: "open"});
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        this._shadowRoot.getElementById("form").addEventListener("submit", this._submit.bind(this));
        
        // Add event listeners for input changes
        this._shadowRoot.getElementById("builder_apiKey").addEventListener("change", this._submit.bind(this));
        this._shadowRoot.getElementById("builder_systemPrompt").addEventListener("change", this._submit.bind(this));
      }
  
      _submit(e) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              apiKey: this.apiKey,
              systemPrompt: this.systemPrompt
            }
          }
        }));
      }
  
      // Getters and setters for the properties
      set apiKey(newApiKey) {
        this._shadowRoot.getElementById("builder_apiKey").value = newApiKey;
      }
  
      get apiKey() {
        return this._shadowRoot.getElementById("builder_apiKey").value;
      }
  
      set systemPrompt(newSystemPrompt) {
        this._shadowRoot.getElementById("builder_systemPrompt").value = newSystemPrompt;
      }
  
      get systemPrompt() {
        return this._shadowRoot.getElementById("builder_systemPrompt").value;
      }
    }
  
    customElements.define("com-example-genaichatwidget-builder", GenAIChatWidgetBuilderPanel);
  })();
