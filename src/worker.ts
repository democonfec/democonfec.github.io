interface WorkerEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

export default {
  fetch(request: Request, environment: WorkerEnvironment) {
    return environment.ASSETS.fetch(request)
  },
}
