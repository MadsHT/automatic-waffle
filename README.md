# automatic-waffle

Demonstrate a deployment that can inject a secret into the continer using IAC

## Problem
currently the secret is stored in plain-text in the repo..

Being build directly into the image itself, cp `.htpasswd` I guess?

## Solution builds on

I will be using the contents of the [dockerfile](/docker/dockerfile) to build an image to deploy that has basic auth using the [auth.htpasswd](/docker/auth.htpasswd) file.

Currently this file allows the `auth.htpasswd` file to be mounted to `/etc/nginx/auth.htpasswd`, but will also allow for a env to be set and adding the content of the `auth.htpasswd` that way.

To build a new image:
``` bash
docker build ./docker -t website
```

To run a newly build image:
```bash
docker run \
--rm \
-e HTPASSWD='<htpasswd content>' \
-p 8080:8080 \
website
```

## Ideas

The ideal solution would be to deploy this container as a deployment that then mounts the `auth.htpasswd` file in the right path..

Azure container instances only (AFAIK) supports the mounting of an [azure fileshare](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-volume-azure-files)

It can also recive environment variables but this does not help since the password would have to be part of the deployment then..

One could randomly generate a new password every deployment, but does this go against the rules, and send that as an evironment variable to the container..

Does the HTPASSWD file have to be a "file"
Answer awaits from Nicolai: Up to me, just make a secure solution..

spinning this up in k8s would require some secret handeling like proposed in [solutions?](#solutions)

## Solutions?

* Using a key-value store to save the secret, from where we can then pull the secret during pipeline run or after deployment in case we're running in a k8s cluster,

  * This could include Hashicorp vault, Azure key vault, etc. and using terraform's [mazurerm_key_vault_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/key_vault_secret), or [getSecret](https://www.pulumi.com/registry/packages/azure/api-docs/keyvault/getsecret/) from pulumi, we could pull the secret during a IAC pipeline.

  * In case we're running in k8s, we could use different tactics like external-secrets [key-vault](https://external-secrets.io/v0.5.6/provider-azure-key-vault/) integration which would allow us to pull secrets into the cluster and store them in the cluster as k8s secrets which we can then mount as a file or pass as environment variables.

* In case we're running in k8s we could also use [sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) which alows encryption of secrets that only the sealed secret controller would be able to decrypt.

* Store the secret as part of the CI/CD tool's secret management e.g. store the secret as a github secret, or in an azure environment value which we can then inject into the pipeline during pipeline run?

* Seems like pulumi also has a way of handling secrets build into it self
https://www.pulumi.com/blog/managing-secrets-with-pulumi/

## Using kubeseal with sealed-secret from helm

Look at this [link](https://github.com/bitnami-labs/sealed-secrets/tree/main/helm/sealed-secrets#using-kubeseal)


## Current solution

Currently the way I have choosen to handle this is using sealed-secrets this is a public-private encryption method, this encrypts a value using a public key, exposed by the cluster, which can then be decrypted by the cluster using the private key it has stored.

This allows us to store our secrets publicly because, you need the private key to get any information from the value published.

I choose this solution to be a little rebal since Nicolai stated and I quote:
>Jeg vil blive ked af det hvis der er en secret, i nogen som helst form, checked ind i repo’et et sted.

So technically there is a secret in the repo now, but it's not really that useful without the private key yo depricpt it.

I choose to write this in Pulumi since it was new and sounded interresting and I wanted to see how it worked..

## To demo

1. Get the two pod names
    ```
    kubectl get pods -o custom-columns=NAME:.metadata.name
    ```

2. Port-forward the deployment no password
    ```
    kubectl port-forward $(kubectl get pods -o custom-columns=NAME:.metadata.name | grep 'no-pass') 8080:8080
    ```

3. Open [localhost:8080](http://localhost:8080) in a new private browser window.<br>
   Try to log in using the username and password.

4. Port-forward the deployment with password
    ```
    kubectl port-forward $(kubectl get pods -o custom-columns=NAME:.metadata.name | grep -v 'no-pass' | tr -d 'NAME') 8080:8080
    ```
5. Open [localhost:8080](http://localhost:8080) in a new private browser window.<br>
   Try to log in using the username and password.
