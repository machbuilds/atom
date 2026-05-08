import Vapor

public func configure(_ app: Application) async throws {
    // Listen on 0.0.0.0:PORT — binding to localhost will fail inside
    // a container. PORT defaults to 8080; override via env at deploy.
    app.http.server.configuration.hostname = "0.0.0.0"
    if let portString = Environment.get("PORT"), let port = Int(portString) {
        app.http.server.configuration.port = port
    } else {
        app.http.server.configuration.port = 8080
    }

    try routes(app)
}

func routes(_ app: Application) throws {
    app.get("healthz") { _ async -> [String: String] in
        ["status": "ok"]
    }

    app.get { _ async -> [String: String] in
        ["hello": "world"]
    }
}
