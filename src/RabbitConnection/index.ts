import { connect, Connection } from 'amqplib'
import { RabbitConfig } from '@ioc:Adonis/Addons/Rabbit'
import InvalidRabbitConfigException from '../Exceptions/InvalidRabbitConfigException'

export default class RabbitConnection {
  /**
   * Whether the connection has already been established
   */
  public hasConnection: boolean = false

  /**
   * The connection
   */
  private $connection?: Connection

  /**
   * The credentials
   */
  private readonly $credentials: string

  /**
   * The hostname
   */
  private readonly $hostname: string

  /**
   * The protocol
   */
  private $protocol: string

  /**
   * The Virtual Host
   */
  private $vhost: string

  constructor(private readonly rabbitConfig: RabbitConfig) {
    this.$credentials = this.handleCredentials(
      this.rabbitConfig.user,
      this.rabbitConfig.password
    )

    this.$hostname = this.handleHostname(
      this.rabbitConfig.hostname,
      this.rabbitConfig.port
    )
    this.$protocol = this.handleProtocol(this.rabbitConfig.protocol)
    this.$vhost = this.handleVHost(this.rabbitConfig.vhost)
  }

  /**
   * Returns the credentials
   *
   * @param user The username
   * @param password The password
   */
  private handleCredentials(
    user: RabbitConfig['user'],
    password: RabbitConfig['password']
  ) {
    if (!user) {
      throw new InvalidRabbitConfigException('Missing RabbitMQ user')
    }

    if (!password) {
      throw new InvalidRabbitConfigException('Missing RabbitMQ password')
    }

    return `${user}:${password}@`
  }

  /**
   * Returns the hostname
   *
   * @param hostname The hostname
   * @param port The port
   */
  private handleHostname(
    hostname: RabbitConfig['hostname'],
    port?: RabbitConfig['port']
  ) {
    if (!hostname) {
      throw new InvalidRabbitConfigException('Missing RabbitMQ hostname')
    }

    return port ? `${hostname}:${port}` : hostname
  }

  /**
   * Custom protocol
   *
   * @param protocol
   */
  private handleProtocol(protocol: RabbitConfig['protocol']) {
    if (!protocol) {
      protocol = 'amqp://'
    }

    return protocol
  }

  /**
   * Custom vhost
   *
   * @param vhost
   */
  private handleVHost(vhost: RabbitConfig['vhost']) {
    if (!vhost || vhost === '/') {
      vhost = ''
    } else {
      vhost = `/${vhost}`
    }

    return vhost
  }

  /**
   * Returns the connection URL
   */
  public get url() {
    return `${this.$protocol}${this.$credentials}${this.$hostname}${this.$vhost}`
  }

  /**
   * Returns the connection
   */
  public async getConnection() {
    if (!this.$connection) {
      try {
        this.$connection = await connect(this.url)

        this.$connection.on('close', () => {
          this.$connection = undefined
          this.hasConnection = false
        })
        this.hasConnection = true
      } catch (error) {
        throw error
      }
    }

    return this.$connection
  }

  /**
   * Closes the connection
   */
  public async closeConnection() {
    if (this.$connection) {
      try {
        await this.$connection.close()
      } catch (error) {}

      this.$connection = undefined
      this.hasConnection = false
    }
  }
}
