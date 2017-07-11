import * as request from 'superagent';
peticion()
function peticion() {
    let req = 'https://github.com/devonfw/devon-guide'
    let token = 'ef7e0c48b1ac910c63a4caf511cc215e844e10b4'
    request.
        head(req).
        set('Authorization', token).
        end(function (err: any, res: request.Response) {

            console.log(res.status)

        })
}